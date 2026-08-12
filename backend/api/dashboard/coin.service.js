import { ASSETS, getAsset } from '../../data/assets.js'
import { config } from '../../config/index.js'

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'
const MAX_COINS = 8

// Everything this app knows about CoinGecko lives here: the two requests it
// makes, and the shape the rest of the app expects back.
export const coinService = {
    getCoins,
    getCoinHistory,
}

// The user's own assets come first, then the rest of the market fills the row
async function getCoins(assets = []) {
    const selectedIds = assets.map(asset => getAsset(asset)?.coinGeckoId).filter(Boolean)
    // The catalogue order decides which coins fill the rest of the row
    const fillIds = ASSETS.map(asset => asset.coinGeckoId).filter(id => !selectedIds.includes(id))
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

async function getCoinHistory(coinId, days) {
    const params = new URLSearchParams({ vs_currency: 'usd', days: String(days) })

    const res = await fetch(`${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?${params}`, {
        headers: _getCoinGeckoHeaders(),
    })
    if (!res.ok) throw new Error(`Coin history request failed with status ${res.status}`)

    const data = await res.json()
    if (!Array.isArray(data.prices)) throw new Error('Coin history returned an unexpected response')

    return data.prices.map(([timestamp, price]) => ({ timestamp, price }))
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

// The demo key is optional, the public endpoints also answer without it
function _getCoinGeckoHeaders() {
    return config.coinGeckoApiKey ? { 'x-cg-demo-api-key': config.coinGeckoApiKey } : undefined
}
