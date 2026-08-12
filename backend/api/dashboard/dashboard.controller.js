import { coinService } from './coin.service.js'
import { insightService } from './insight.service.js'
import { newsService } from './news.service.js'
import { memeService } from './meme.service.js'
import { userService } from '../user/user.service.js'
import { COIN_GECKO_IDS } from '../../data/assets.js'
import { logger } from '../../services/logger.service.js'

// A year of daily points is the most any chart here asks for
const MAX_HISTORY_DAYS = 400
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export async function getCoins(req, res) {
    try {
        const user = await _getUser(req)
        const coins = await coinService.getCoins(user?.preferences?.assets || [])

        res.json(coins)
    } catch (err) {
        logger.error('Failed to get the coins:', err.message)
        res.status(502).send({ err: 'Coin data is temporarily unavailable' })
    }
}

export async function getCoinHistory(req, res) {
    const { coinId } = req.params
    const days = Number(req.query.days)

    // Only coins this app supports, so the route cannot be used as a proxy
    if (!COIN_GECKO_IDS.includes(coinId)) return res.status(400).send({ err: 'Unknown coin' })
    if (!Number.isInteger(days) || days < 1 || days > MAX_HISTORY_DAYS) {
        return res.status(400).send({ err: 'Days must be a whole number between 1 and 400' })
    }

    try {
        const history = await coinService.getCoinHistory(coinId, days)
        res.json(history)
    } catch (err) {
        logger.error('Failed to get the coin history:', err.message)
        res.status(502).send({ err: 'Chart data is temporarily unavailable' })
    }
}

// The date is the browser's calendar day: only the client knows where the user is.
// Everything else about the insight is read from the database.
export async function getInsight(req, res) {
    const { date } = req.query
    if (!DATE_PATTERN.test(date)) return res.status(400).send({ err: 'A date in the form YYYY-MM-DD is required' })

    try {
        const user = await _getUser(req)
        if (!user) return res.status(404).send({ err: 'User not found' })

        const insight = await insightService.getInsight(user, date)
        res.json(insight)
    } catch (err) {
        logger.error('Failed to get the insight:', err.message)
        res.status(502).send({ err: 'Today\'s insight is temporarily unavailable' })
    }
}

export async function getNews(req, res) {
    try {
        const user = await _getUser(req)
        const { assets = [], investorType = '' } = user?.preferences || {}

        res.json(await newsService.getNews(assets, investorType))
    } catch (err) {
        logger.error('Failed to get the news:', err.message)
        res.status(502).send({ err: 'News is temporarily unavailable' })
    }
}

// The meme is the same for everyone, so nothing about the user is read here
export async function getMeme(req, res) {
    try {
        res.json(await memeService.getMeme())
    } catch (err) {
        logger.error('Failed to get the meme:', err.message)
        res.status(502).send({ err: 'The meme is temporarily unavailable' })
    }
}

// Personalization always reads the stored user, never the request
async function _getUser(req) {
    return userService.getById(req.loggedinUser._id)
}
