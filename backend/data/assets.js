// The assets this app supports, described the way the server needs them.
//
// The client has its own copy in src/data/assets.js holding the presentation
// side: the label, the ticker and the onboarding icon. The two files share only
// the `value`, which is what onboarding saves and what the api validates.
// They are kept apart on purpose: sharing one file would mean a build step or a
// package just to move a handful of constants, and the server has no use for an
// icon while the browser has no use for a NewsData coin code.
//
// value        the value saved in the user's preferences, never change these
// symbol       the ticker, used to build the insight context key
// coinGeckoId  the coin id CoinGecko knows this asset by
// newsCode     the coin code NewsData knows this asset by
// searchTerms  words that mean this asset appears in an article's text
//
// The order below is the order coins are filled in when the user picked fewer
// than the maximum.
export const ASSETS = [
    { value: 'bitcoin', symbol: 'BTC', coinGeckoId: 'bitcoin', newsCode: 'btc', searchTerms: ['btc', 'bitcoin'] },
    { value: 'ethereum', symbol: 'ETH', coinGeckoId: 'ethereum', newsCode: 'eth', searchTerms: ['eth', 'ethereum', 'ether'] },
    { value: 'solana', symbol: 'SOL', coinGeckoId: 'solana', newsCode: 'sol', searchTerms: ['sol', 'solana'] },
    { value: 'xrp', symbol: 'XRP', coinGeckoId: 'ripple', newsCode: 'xrp', searchTerms: ['xrp', 'ripple'] },
    { value: 'bnb', symbol: 'BNB', coinGeckoId: 'binancecoin', newsCode: 'bnb', searchTerms: ['bnb', 'binance coin', 'binance'] },
    { value: 'dogecoin', symbol: 'DOGE', coinGeckoId: 'dogecoin', newsCode: 'doge', searchTerms: ['doge', 'dogecoin'] },
    { value: 'cardano', symbol: 'ADA', coinGeckoId: 'cardano', newsCode: 'ada', searchTerms: ['ada', 'cardano'] },
    { value: 'avalanche', symbol: 'AVAX', coinGeckoId: 'avalanche-2', newsCode: 'avax', searchTerms: ['avax', 'avalanche'] },
]

// The onboarding values, used to validate what the client sends
export const ASSET_VALUES = ASSETS.map(asset => asset.value)

// The coin ids we are willing to ask CoinGecko about
export const COIN_GECKO_IDS = ASSETS.map(asset => asset.coinGeckoId)

// Returns null for a value we no longer support, so every caller can skip it
export function getAsset(value) {
    return ASSETS.find(asset => asset.value === value) || null
}
