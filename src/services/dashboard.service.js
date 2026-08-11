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

export const dashboardService = {
    getNews,
    getCoinData,
    getCoinHistory,
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
