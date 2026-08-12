import { ObjectId } from 'mongodb'

import { INVESTOR_FOCUS, CONTENT_STYLE, INSIGHT_SYSTEM_PROMPT } from '../../data/insight-prompt.js'
import { getAsset } from '../../data/assets.js'
import { coinService } from './coin.service.js'
import { config } from '../../config/index.js'
import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
// A specific model rather than the openrouter/free router, which answers with a
// different free model every request. Those vary from plain answers to long
// reasoning ones, and a reasoning model can spend its whole output budget
// thinking and return nothing to read.
const OPENROUTER_MODEL = 'google/gemma-4-26b-a4b-it:free'
const INSIGHTS_COLLECTION = 'dailyInsights'

// The day's insight: written once through OpenRouter, kept in the database, and
// replaced by a plain local summary whenever the model cannot be reached.
// This is the only dashboard service that stores anything.
export const insightService = {
    getInsight,
    createIndexes,
}

// One insight per user, per preference set, per day
async function createIndexes() {
    const collection = await dbService.getCollection(INSIGHTS_COLLECTION)
    await collection.createIndex({ userId: 1, contextKey: 1, insightDate: 1 }, { unique: true })

    logger.info('Daily insight indexes are in place')
}

// Today's insight is written once per user, per set of preferences, per day, and
// then read from the database. A failed generation is answered with the local
// fallback and is deliberately not stored, so the next visit tries OpenRouter again.
async function getInsight(user, insightDate) {
    const { assets, investorType, contentTypes } = user.preferences
    if (!assets.length) throw new Error('No assets to build an insight from')

    // Built from the stored preferences alone, so a day that is already written
    // is answered from the database without asking CoinGecko for anything
    const contextKey = _getInsightContextKey(assets, investorType, contentTypes)

    const savedInsight = await _getSavedInsight(user._id, contextKey, insightDate)
    if (savedInsight) return _toInsight(savedInsight, contextKey, insightDate)

    try {
        const coins = await coinService.getCoins(assets)
        const selectedCoins = coins.filter(coin => coin.isSelected)
        if (!selectedCoins.length) throw new Error('No coins to build an insight from')

        const insight = await _createInsight(selectedCoins, investorType, contentTypes)
        const saved = await _saveInsight({ userId: user._id, contextKey, insightDate, ...insight })

        return _toInsight(saved, contextKey, insightDate)
    } catch (err) {
        // Not stored, so the next request can still reach OpenRouter
        logger.warn('Using the local insight:', err.message)

        return _toInsight(await _buildFallbackInsight(assets), contextKey, insightDate)
    }
}

// The fallback still needs the market numbers. If even those cannot be fetched
// the section has nothing truthful to show, so the failure travels on.
async function _buildFallbackInsight(assets) {
    const coins = await coinService.getCoins(assets)
    const selectedCoins = coins.filter(coin => coin.isSelected)
    if (!selectedCoins.length) throw new Error('No coins to build an insight from')

    return _createFallbackInsight(selectedCoins)
}

// The id has to be the same on every reload, because the feedback record for an
// insight is identified by it. A new day or new preferences give a new id.
function _toInsight({ title, text, source }, contextKey, insightDate) {
    return {
        id: `${source}|${contextKey}|${insightDate}`,
        title,
        text,
        source,
    }
}

// Sorted, so the same preferences always produce the same key
function _getInsightContextKey(assets, investorType, contentTypes) {
    const symbols = assets.map(asset => getAsset(asset)?.symbol).filter(Boolean).sort().join(',')
    const sortedContentTypes = [...contentTypes].sort().join(',')

    return `${symbols}|${investorType}|${sortedContentTypes}`
}

async function _getSavedInsight(userId, contextKey, insightDate) {
    const collection = await dbService.getCollection(INSIGHTS_COLLECTION)
    return collection.findOne({ userId: new ObjectId(userId), contextKey, insightDate })
}

async function _saveInsight({ userId, contextKey, insightDate, title, text }) {
    const collection = await dbService.getCollection(INSIGHTS_COLLECTION)

    // An upsert, so two first visits at the same moment cannot both insert
    return collection.findOneAndUpdate(
        { userId: new ObjectId(userId), contextKey, insightDate },
        {
            $set: { title, text, source: 'openrouter' },
            $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true, returnDocument: 'after' },
    )
}

async function _createInsight(coins, investorType, contentTypes) {
    if (!config.openRouterApiKey) throw new Error('Missing OpenRouter API key')

    const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.openRouterApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [
                { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
                { role: 'user', content: _getInsightUserPrompt(coins, investorType, contentTypes) },
            ],
        }),
    })
    if (!res.ok) {
        const apiMessage = await _getApiErrorMessage(res)
        throw new Error(`Insight request failed with status ${res.status}${apiMessage ? `: ${apiMessage}` : ''}`)
    }

    const data = await res.json()

    const choice = data.choices?.[0]
    if (!choice) throw new Error('Insight response returned no choices')

    const content = choice.message?.content
    if (!content) throw new Error(`Insight response had no content: ${_describeEmptyChoice(data, choice)}`)

    return _parseInsight(content)
}

// OpenRouter explains a rejected request in error.message. Only that one sentence
// is read: never the rest of the body, and never the url, which carries the key.
async function _getApiErrorMessage(res) {
    try {
        const data = await res.json()
        return data?.error?.message || ''
    } catch {
        return ''
    }
}

// Why an answer came back with nothing to read, using field names, numbers and
// the model's own status words only. None of the prompt, the answer or the
// model's reasoning is included, just how long the reasoning was.
function _describeEmptyChoice(data, choice) {
    return [
        `model=${data.model || 'unknown'}`,
        `finish_reason=${choice.finish_reason || 'none'}`,
        `native_finish_reason=${choice.native_finish_reason || 'none'}`,
        `reasoning=${(choice.message?.reasoning || '').length} chars`,
        `refusal=${choice.message?.refusal ? 'yes' : 'no'}`,
    ].join(', ')
}

function _getInsightUserPrompt(coins, investorType, contentTypes) {
    const marketLines = coins
        .map(coin => `${coin.symbol}: $${coin.currentPrice}, ${(coin.priceChange24h ?? 0).toFixed(2)}% 24h`)
        .join('\n')

    const focusLines = INVESTOR_FOCUS[investorType] || ['The reader is a crypto investor.']
    const styleLines = contentTypes
        .map(contentType => CONTENT_STYLE[contentType])
        .filter(Boolean)

    return [
        'What to focus on:',
        ...focusLines.map(line => `- ${line}`),
        '',
        styleLines.length ? 'How to present it:' : '',
        ...styleLines.map(line => `- ${line}`),
        '',
        'Current market data for the assets they follow:',
        marketLines,
        '',
        'Facts already calculated by the application. Treat these as authoritative and use them as they are:',
        _formatMarketFacts(_getMarketFacts(coins)),
    ].filter(Boolean).join('\n')
}

// The model sometimes wraps the JSON in text, so the object is picked out of the answer
function _parseInsight(content) {
    const start = content.indexOf('{')
    const end = content.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('Insight response was not valid JSON')

    const parsed = JSON.parse(content.slice(start, end + 1))
    if (!parsed.title || !parsed.text) throw new Error('Insight response was missing a title or text')

    return { title: parsed.title, text: parsed.text }
}

function _changeOf(coin) {
    return coin.priceChange24h ?? 0
}

// The one place the comparisons are calculated. The prompt and the local
// fallback insight both build on this, so the numbers can never disagree.
function _getMarketFacts(coins) {
    const sorted = [...coins].sort((a, b) => _changeOf(b) - _changeOf(a))

    const up = coins.filter(coin => _changeOf(coin) > 0).length
    const down = coins.filter(coin => _changeOf(coin) < 0).length

    return {
        strongest: sorted[0],
        weakest: sorted[sorted.length - 1],
        up,
        down,
        unchanged: coins.length - up - down,
        total: coins.length,
    }
}

// The exact wording the model receives, unchanged
function _formatMarketFacts(facts) {
    const lines = []

    if (facts.total > 1) {
        lines.push(`Strongest 24 hour performer: ${facts.strongest.symbol} (${_formatChange(_changeOf(facts.strongest))})`)
        lines.push(`Weakest 24 hour performer: ${facts.weakest.symbol} (${_formatChange(_changeOf(facts.weakest))})`)
    }
    lines.push(`Assets up over 24 hours: ${facts.up} of ${facts.total}`)
    lines.push(`Assets down over 24 hours: ${facts.down} of ${facts.total}`)
    if (facts.unchanged) lines.push(`Assets unchanged over 24 hours: ${facts.unchanged} of ${facts.total}`)

    return lines.join('\n')
}

function _formatChange(change) {
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
}

// Plain factual insight built from the same facts, used when OpenRouter is unavailable
function _createFallbackInsight(coins) {
    const facts = _getMarketFacts(coins)
    const strongestChange = _changeOf(facts.strongest)
    const weakestChange = _changeOf(facts.weakest)
    const sentences = []

    if (facts.total === 1) {
        sentences.push(`${facts.strongest.symbol} is your only selected asset, ${_describeMove(strongestChange)} over the last 24 hours.`)
    } else if (strongestChange === weakestChange) {
        sentences.push(`All ${facts.total} of your selected assets are ${_describeMove(strongestChange)} over the last 24 hours.`)
    } else {
        sentences.push(`${facts.strongest.symbol} is the strongest performer among your selected assets at ${_formatChange(strongestChange)}, while ${facts.weakest.symbol} is the weakest at ${_formatChange(weakestChange)}.`)

        const counts = []
        if (facts.up) counts.push(`${facts.up} up`)
        if (facts.down) counts.push(`${facts.down} down`)
        if (facts.unchanged) counts.push(`${facts.unchanged} unchanged`)
        sentences.push(`Across your ${facts.total} selected assets that is ${_joinParts(counts)} over the last 24 hours.`)
    }

    return { title: 'Today\'s market snapshot', text: sentences.join(' '), source: 'local-fallback' }
}

function _describeMove(change) {
    if (change > 0) return `up ${_formatChange(change).slice(1)}`
    if (change < 0) return `down ${Math.abs(change).toFixed(2)}%`
    return 'unchanged'
}

function _joinParts(parts) {
    if (parts.length === 1) return parts[0]
    return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}
