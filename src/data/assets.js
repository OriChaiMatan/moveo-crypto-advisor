// The assets this app supports, and the static metadata each one needs.
//
// No market data lives here: prices, images, market cap, volume and history
// all come from CoinGecko at runtime.
//
// value        the value saved in the user's preferences, never change these
// label        full name, shown during onboarding
// symbol       ticker, shown on the dashboard tags
// coinGeckoId  the coin id CoinGecko knows this asset by
// newsCode     the coin code NewsData knows this asset by
// searchTerms  words that mean this asset appears in an article's text
// icon         paths for the 24x24 onboarding icon
//
// The order below is also the order the assets appear in onboarding, and the
// order CoinGecko coins are filled in when the user picked fewer than eight.
export const ASSETS = [
    {
        value: 'bitcoin',
        label: 'Bitcoin',
        symbol: 'BTC',
        coinGeckoId: 'bitcoin',
        newsCode: 'btc',
        searchTerms: ['btc', 'bitcoin'],
        icon: ['M9.5 7v10', 'M9.5 7h4.5a2.5 2.5 0 0 1 0 5h-4.5', 'M9.5 12h5a2.5 2.5 0 0 1 0 5h-5', 'M12 5v2', 'M12 17v2'],
    },
    {
        value: 'ethereum',
        label: 'Ethereum',
        symbol: 'ETH',
        coinGeckoId: 'ethereum',
        newsCode: 'eth',
        searchTerms: ['eth', 'ethereum', 'ether'],
        icon: ['M12 4l5.5 8L12 15 6.5 12z', 'M6.5 13.5L12 20l5.5-6.5'],
    },
    {
        value: 'solana',
        label: 'Solana',
        symbol: 'SOL',
        coinGeckoId: 'solana',
        newsCode: 'sol',
        searchTerms: ['sol', 'solana'],
        icon: ['M7.5 8.5h9', 'M6.5 12h9', 'M7.5 15.5h9'],
    },
    {
        value: 'xrp',
        label: 'XRP',
        symbol: 'XRP',
        coinGeckoId: 'ripple',
        newsCode: 'xrp',
        searchTerms: ['xrp', 'ripple'],
        icon: ['M7 6l5 5 5-5', 'M7 18l5-5 5 5'],
    },
    {
        value: 'bnb',
        label: 'BNB',
        symbol: 'BNB',
        coinGeckoId: 'binancecoin',
        newsCode: 'bnb',
        searchTerms: ['bnb', 'binance coin', 'binance'],
        icon: ['M12 4.5l3 3-3 3-3-3z', 'M12 13.5l3 3-3 3-3-3z', 'M7.5 9l3 3-3 3-3-3z', 'M16.5 9l3 3-3 3-3-3z'],
    },
    {
        value: 'dogecoin',
        label: 'Dogecoin',
        symbol: 'DOGE',
        coinGeckoId: 'dogecoin',
        newsCode: 'doge',
        searchTerms: ['doge', 'dogecoin'],
        icon: ['M9.5 7v10', 'M9.5 7h3a5 5 0 0 1 0 10h-3', 'M7.5 12h5'],
    },
    {
        value: 'cardano',
        label: 'Cardano',
        symbol: 'ADA',
        coinGeckoId: 'cardano',
        newsCode: 'ada',
        searchTerms: ['ada', 'cardano'],
        icon: ['M8.5 17.5L12 6.5l3.5 11', 'M10 14h4'],
    },
    {
        value: 'avalanche',
        label: 'Avalanche',
        symbol: 'AVAX',
        coinGeckoId: 'avalanche-2',
        newsCode: 'avax',
        searchTerms: ['avax', 'avalanche'],
        icon: ['M12 5.5L19 18H5z'],
    },
]

// Returns null for a value we no longer support, so every caller can skip it
export function getAsset(value) {
    return ASSETS.find(asset => asset.value === value) || null
}
