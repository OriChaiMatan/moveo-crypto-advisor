// The assets this app supports, and how each one is shown.
//
// Only presentation lives here. Which coin id CoinGecko knows an asset by, and
// which words identify it in an article, are the server's business and live in
// backend/data/assets.js. The two files share only the `value`.
//
// value   the value saved in the user's preferences, never change these
// label   full name, shown during onboarding
// symbol  ticker, shown on the dashboard tags
// icon    paths for the 24x24 onboarding icon
//
// The order below is the order the assets appear in onboarding.
export const ASSETS = [
    {
        value: 'bitcoin',
        label: 'Bitcoin',
        symbol: 'BTC',
        icon: ['M9.5 7v10', 'M9.5 7h4.5a2.5 2.5 0 0 1 0 5h-4.5', 'M9.5 12h5a2.5 2.5 0 0 1 0 5h-5', 'M12 5v2', 'M12 17v2'],
    },
    {
        value: 'ethereum',
        label: 'Ethereum',
        symbol: 'ETH',
        icon: ['M12 4l5.5 8L12 15 6.5 12z', 'M6.5 13.5L12 20l5.5-6.5'],
    },
    {
        value: 'solana',
        label: 'Solana',
        symbol: 'SOL',
        icon: ['M7.5 8.5h9', 'M6.5 12h9', 'M7.5 15.5h9'],
    },
    {
        value: 'xrp',
        label: 'XRP',
        symbol: 'XRP',
        icon: ['M7 6l5 5 5-5', 'M7 18l5-5 5 5'],
    },
    {
        value: 'bnb',
        label: 'BNB',
        symbol: 'BNB',
        icon: ['M12 4.5l3 3-3 3-3-3z', 'M12 13.5l3 3-3 3-3-3z', 'M7.5 9l3 3-3 3-3-3z', 'M16.5 9l3 3-3 3-3-3z'],
    },
    {
        value: 'dogecoin',
        label: 'Dogecoin',
        symbol: 'DOGE',
        icon: ['M9.5 7v10', 'M9.5 7h3a5 5 0 0 1 0 10h-3', 'M7.5 12h5'],
    },
    {
        value: 'cardano',
        label: 'Cardano',
        symbol: 'ADA',
        icon: ['M8.5 17.5L12 6.5l3.5 11', 'M10 14h4'],
    },
    {
        value: 'avalanche',
        label: 'Avalanche',
        symbol: 'AVAX',
        icon: ['M12 5.5L19 18H5z'],
    },
]

// Returns null for a value we no longer support, so every caller can skip it
export function getAsset(value) {
    return ASSETS.find(asset => asset.value === value) || null
}
