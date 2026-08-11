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

export const dashboardService = {
    getNews,
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
