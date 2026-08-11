import { FALLBACK_NEWS } from '../data/news'

const NEWSDATA_URL = 'https://newsdata.io/api/1/crypto'
const MAX_NEWS_ITEMS = 6
const API_PAGE_SIZE = 10 // the free plan rejects anything higher

// Onboarding asset values mapped to NewsData coin codes
const ASSET_COINS = {
    bitcoin: 'btc',
    ethereum: 'eth',
    solana: 'sol',
    xrp: 'xrp',
    bnb: 'bnb',
    dogecoin: 'doge',
    cardano: 'ada',
    avalanche: 'avax',
}

// NewsData tags articles loosely, so we also look for these terms in the text
const ASSET_TERMS = {
    bitcoin: ['btc', 'bitcoin'],
    ethereum: ['eth', 'ethereum', 'ether'],
    solana: ['sol', 'solana'],
    xrp: ['xrp', 'ripple'],
    bnb: ['bnb', 'binance coin', 'binance'],
    dogecoin: ['doge', 'dogecoin'],
    cardano: ['ada', 'cardano'],
    avalanche: ['avax', 'avalanche'],
}

// Terms that move an article up the list. 'just-exploring' is missing on purpose,
// so its feed keeps the original order.
const INVESTOR_TERMS = {
    'hodler': ['institutional', 'staking', 'adoption'],
    'day-trader': ['price', 'volume', 'trading'],
    'nft-collector': ['nft', 'gaming', 'marketplace'],
}

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'
const MAX_COINS = 8

// Onboarding asset values mapped to CoinGecko coin ids.
// The fill order below is also the order used when the user picked fewer than eight.
const ASSET_COIN_IDS = {
    bitcoin: 'bitcoin',
    ethereum: 'ethereum',
    solana: 'solana',
    xrp: 'ripple',
    bnb: 'binancecoin',
    dogecoin: 'dogecoin',
    cardano: 'cardano',
    avalanche: 'avalanche-2',
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODEL = 'openrouter/free'
const INSIGHT_STORAGE_KEY = 'cryptoAdvisorDailyInsight'

// The investor type decides what the insight focuses on
const INVESTOR_FOCUS = {
    'hodler': [
        'The reader is a long term holder.',
        'Lead with the broadest comparison between the assets, not with a single small move.',
        'Say which asset is relatively strongest or weakest right now, without implying any longer trend.',
        'Keep the tone calm and measured, and do not treat small 24 hour moves as significant.',
    ],
    'day-trader': [
        'The reader is an active day trader.',
        'Lead with the largest 24 hour move.',
        'Compare the strongest and the weakest asset directly.',
        'Be direct and put the numbers first.',
        'Mention how many assets are up versus down when it adds something.',
    ],
    'nft-collector': [
        'The reader is an NFT collector.',
        'Keep the framing asset minded and slightly lighter.',
        'No NFT or ecosystem data was supplied, so never invent any. Stay concise instead.',
    ],
    'just-exploring': [
        'The reader is new to crypto.',
        'Use the full coin names where practical, for example Bitcoin rather than BTC.',
        'Use simple language and explain the comparison plainly.',
        'Avoid trader terminology.',
    ],
}

// The content preferences decide how the insight is presented
const CONTENT_STYLE = {
    'market-news': 'Write it as a concise market briefing: a headline and a short summary.',
    'charts': 'Put the numbers at the centre and emphasise the percentage differences between the assets.',
    'social': 'Keep it short, punchy and easy to read. Never claim anything about social sentiment.',
    'fun': 'Use a lighter tone and at most one mild playful phrase. Stay factual, with no meme style exaggeration.',
}

export const dashboardService = {
    getNews,
    getCoinData,
    getCoinHistory,
    getInsight,
}

// Reuses today's insight while it still matches the user's preferences
async function getInsight(coins = [], investorType = '', contentTypes = []) {
    const contextKey = _getInsightContextKey(coins, investorType, contentTypes)
    const savedInsight = _getSavedInsight()

    if (savedInsight
        && savedInsight.contextKey === contextKey
        && _isToday(savedInsight.createdAt)) {
        return savedInsight
    }

    // Nothing is saved if this throws, so a failed request keeps the error state
    const insight = await _createInsight(coins, investorType, contentTypes)
    const insightToSave = { ...insight, contextKey }
    localStorage.setItem(INSIGHT_STORAGE_KEY, JSON.stringify(insightToSave))

    return insightToSave
}

// A new calendar day means a new insight, even if only minutes have passed
function _isToday(timestamp) {
    const createdAt = new Date(timestamp)
    const now = new Date()

    return createdAt.getFullYear() === now.getFullYear()
        && createdAt.getMonth() === now.getMonth()
        && createdAt.getDate() === now.getDate()
}

// Sorted, so the same preferences always produce the same key
function _getInsightContextKey(coins, investorType, contentTypes) {
    const symbols = coins.map(coin => coin.symbol).sort().join(',')
    const sortedContentTypes = [...contentTypes].sort().join(',')

    return `${symbols}|${investorType}|${sortedContentTypes}`
}

function _getSavedInsight() {
    try {
        const savedInsight = JSON.parse(localStorage.getItem(INSIGHT_STORAGE_KEY))
        if (!savedInsight?.title || !savedInsight.text || !savedInsight.createdAt || !savedInsight.contextKey) return null

        return savedInsight
    } catch (err) {
        // A corrupted value is ignored here and overwritten by the next generated insight
        console.log('Ignoring saved insight:', err.message)
        return null
    }
}

async function _createInsight(coins, investorType, contentTypes) {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
    if (!apiKey) throw new Error('Missing OpenRouter API key')
    if (!coins.length) throw new Error('No coins to build an insight from')

    const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [
                { role: 'system', content: _getInsightSystemPrompt() },
                { role: 'user', content: _getInsightUserPrompt(coins, investorType, contentTypes) },
            ],
        }),
    })
    if (!res.ok) throw new Error(`Insight request failed with status ${res.status}`)

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Insight response was empty')

    const insight = _parseInsight(content)
    return { ...insight, createdAt: Date.now() }
}

function _getInsightSystemPrompt() {
    return [
        'You are a concise crypto market analyst writing one personalized insight for a dashboard.',
        'You receive only a current price and a 24 hour percentage change for each asset. Nothing else.',
        '',
        'Every statement you make must be provable from those two numbers alone.',
        '',
        'You may:',
        '- State the current price of an asset.',
        '- State whether an asset is up or down over the last 24 hours, and by how much.',
        '- Compare the supplied 24 hour changes with each other, for example which asset rose or fell the most.',
        '- Count how many of the assets are up or down.',
        '',
        'You must not:',
        '- Describe trends, momentum, direction of travel, recoveries, rallies, dips, fading gains or continued losses.',
        '- Refer to any earlier price, past performance, historical behaviour, or how the assets behaved before this 24 hour window.',
        '- Explain why a price moved, or connect a move to any event, news or market condition.',
        '- Mention sentiment, hype, confidence, fear, interest or anything about how people feel.',
        '- Say what is likely to happen next, or predict prices.',
        '- Give financial advice or a recommendation to buy, sell or hold.',
        '- Add any fact that was not supplied in the message.',
        '',
        'Write "DOGE is showing the strongest 24 hour performance among your assets" rather than "the momentum is all in DOGE right now".',
        'If the data does not support an observation, leave it out rather than softening it.',
        '',
        'How to write it:',
        '- Lead with the single most relevant observation for this reader, then support it with only the numbers that observation needs.',
        '- Do not recite every asset in the same order every time. A plain list of all the assets is not an insight.',
        '- The message includes facts already calculated by the application. Use them exactly as given.',
        '- Never work out yourself which asset is strongest or weakest, and never count how many assets are up or down. Those answers are supplied.',
        '- Never contradict the supplied values or the calculated facts.',
        '',
        'Maximum 3 sentences.',
        'Answer with JSON only, in this exact shape:',
        '{"title": "short headline", "text": "the insight"}',
    ].join('\n')
}

// The comparisons are calculated here, so the model never has to work them out itself
function _getMarketFacts(coins) {
    const changeOf = coin => coin.priceChange24h ?? 0
    const formatChange = change => `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`

    const sorted = [...coins].sort((a, b) => changeOf(b) - changeOf(a))
    const strongest = sorted[0]
    const weakest = sorted[sorted.length - 1]

    const up = coins.filter(coin => changeOf(coin) > 0).length
    const down = coins.filter(coin => changeOf(coin) < 0).length
    const unchanged = coins.length - up - down

    const facts = []
    if (coins.length > 1) {
        facts.push(`Strongest 24 hour performer: ${strongest.symbol} (${formatChange(changeOf(strongest))})`)
        facts.push(`Weakest 24 hour performer: ${weakest.symbol} (${formatChange(changeOf(weakest))})`)
    }
    facts.push(`Assets up over 24 hours: ${up} of ${coins.length}`)
    facts.push(`Assets down over 24 hours: ${down} of ${coins.length}`)
    if (unchanged) facts.push(`Assets unchanged over 24 hours: ${unchanged} of ${coins.length}`)

    return facts.join('\n')
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
        _getMarketFacts(coins),
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

// The demo key is optional, the public endpoints also answer without it
function _getCoinGeckoHeaders() {
    const apiKey = import.meta.env.VITE_COINGECKO_API_KEY
    return apiKey ? { 'x-cg-demo-api-key': apiKey } : undefined
}

// The signal lets the caller drop a request that a newer one replaced
async function getCoinHistory(coinId, days, signal) {
    const params = new URLSearchParams({ vs_currency: 'usd', days: String(days) })

    const res = await fetch(`${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?${params}`, {
        headers: _getCoinGeckoHeaders(),
        signal,
    })
    if (!res.ok) throw new Error(`Coin history request failed with status ${res.status}`)

    const data = await res.json()
    if (!Array.isArray(data.prices)) throw new Error('Coin history returned an unexpected response')

    return data.prices.map(([timestamp, price]) => ({ timestamp, price }))
}

async function getCoinData(assets = []) {
    const selectedIds = assets.map(asset => ASSET_COIN_IDS[asset]).filter(Boolean)
    const fillIds = Object.values(ASSET_COIN_IDS).filter(id => !selectedIds.includes(id))
    const coinIds = [...selectedIds, ...fillIds].slice(0, MAX_COINS)

    const params = new URLSearchParams({
        vs_currency: 'usd',
        ids: coinIds.join(','),
        price_change_percentage: '24h',
        sparkline: 'true',
    })

    const res = await fetch(`${COINGECKO_BASE_URL}/coins/markets?${params}`, {
        headers: _getCoinGeckoHeaders(),
    })
    if (!res.ok) throw new Error(`Coin request failed with status ${res.status}`)

    const data = await res.json()
    if (!Array.isArray(data)) throw new Error('Coin request returned an unexpected response')

    // The API answers in market cap order, so the selected coins are moved back to the front
    return coinIds
        .map(coinId => data.find(coin => coin.id === coinId))
        .filter(Boolean)
        .map(coin => _normalizeCoin(coin, selectedIds))
}

function _normalizeCoin(coin, selectedIds) {
    return {
        id: coin.id,
        symbol: (coin.symbol || '').toUpperCase(),
        name: coin.name || '',
        image: coin.image || '',
        currentPrice: coin.current_price,
        priceChange24h: coin.price_change_percentage_24h,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        sparkline: coin.sparkline_in_7d?.price || [],
        isSelected: selectedIds.includes(coin.id),
    }
}

async function getNews(assets = [], investorType = '') {
    const apiNews = _prioritizeByInvestorType(await _getNewsFromApi(assets), investorType)

    // Real articles are never mixed with fallback content, even if there are fewer than six
    if (apiNews.length) {
        return { items: apiNews.slice(0, MAX_NEWS_ITEMS), source: 'api' }
    }

    return { items: _getFallbackNews(assets), source: 'fallback' }
}

// Returns an empty array on any problem, so the caller can fall back
async function _getNewsFromApi(assets) {
    const coins = assets.map(asset => ASSET_COINS[asset]).filter(Boolean)
    if (!coins.length) return []

    try {
        const apiKey = import.meta.env.VITE_NEWSDATA_API_KEY
        if (!apiKey) throw new Error('Missing NewsData API key')

        const params = new URLSearchParams({
            apikey: apiKey,
            coin: coins.join(','),
            language: 'en',
            size: String(API_PAGE_SIZE),
        })

        const res = await fetch(`${NEWSDATA_URL}?${params}`)
        if (!res.ok) throw new Error(`News request failed with status ${res.status}`)

        const data = await res.json()
        return _cleanApiPosts(data.results || [], assets)
    } catch (err) {
        // The message never contains the request url, so the key stays out of the log
        console.log('Loading live news failed:', err.message)
        return []
    }
}

function _cleanApiPosts(posts, assets) {
    const seenTitles = new Set()

    return posts
        .filter(post => post.title && !post.duplicate)
        .map(_normalizeApiPost)
        .filter(article => {
            const titleKey = article.title.trim().toLowerCase()
            if (seenTitles.has(titleKey)) return false
            seenTitles.add(titleKey)
            return true
        })
        .map(article => _withRelevantAssets(article, assets))
        .filter(Boolean)
}

function _normalizeApiPost(post) {
    return {
        id: post.article_id,
        title: post.title || '',
        description: post.description || '',
        publishedAt: post.pubDate || '',
        source: post.source_name || '',
        url: post.link || '',
        image: post.image_url || '',
        currencies: (post.coin || []).map(coin => coin.toUpperCase()),
    }
}

// Keeps the article only if its text really mentions a selected asset,
// and narrows the tags down to the assets it actually talks about
function _withRelevantAssets(article, assets) {
    const text = `${article.title} ${article.description}`
    const matchedAssets = assets.filter(asset => _mentionsAsset(text, asset))
    if (!matchedAssets.length) return null

    return { ...article, currencies: matchedAssets.map(asset => ASSET_COINS[asset].toUpperCase()) }
}

function _mentionsAsset(text, asset) {
    const terms = ASSET_TERMS[asset] || []
    return terms.some(term => new RegExp(`\\b${term}\\b`, 'i').test(text))
}

// Articles mentioning one of the investor's terms come first, the rest keep their place
function _prioritizeByInvestorType(articles, investorType) {
    const terms = INVESTOR_TERMS[investorType]
    if (!terms) return articles

    const preferred = []
    const regular = []

    articles.forEach(article => {
        const text = `${article.title} ${article.description}`.toLowerCase()
        const isPreferred = terms.some(term => text.includes(term))
        if (isPreferred) preferred.push(article)
        else regular.push(article)
    })

    return [...preferred, ...regular]
}

function _getFallbackNews(assets) {
    const coins = assets.map(asset => ASSET_COINS[asset]?.toUpperCase()).filter(Boolean)

    return FALLBACK_NEWS
        .filter(article => !coins.length || article.currencies.some(code => coins.includes(code)))
        .slice(0, MAX_NEWS_ITEMS)
}
