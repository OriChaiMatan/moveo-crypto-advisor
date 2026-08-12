// The onboarding answers this app supports, and how each one is presented.
//
// Only values and labels live here. How an investor type ranks news, how it
// steers the AI prompt, and which section a content type promotes are all
// behaviour, and stay with the code that owns them.
//
// value        the value saved in the user's preferences, never change these
// label        shown during onboarding and on the dashboard tags
// description  the extra line under an investor type in onboarding
// icon         paths for the 24x24 onboarding icon

export const INVESTOR_TYPES = [
    {
        value: 'hodler',
        label: 'HODLer',
        description: 'In it for the long run',
        icon: ['M12 4l6 2.5v5c0 4-2.6 6.6-6 8-3.4-1.4-6-4-6-8v-5z'],
    },
    {
        value: 'day-trader',
        label: 'Day Trader',
        description: 'Following the market daily',
        icon: ['M8 5v14', 'M6.5 8.5h3v6h-3z', 'M16 5v14', 'M14.5 10h3v5h-3z'],
    },
    {
        value: 'nft-collector',
        label: 'NFT Collector',
        description: 'Collecting and following drops',
        icon: ['M4.5 5.5h15v13h-15z', 'M4.5 15l4-3.5 3.5 3 3-2.5 4 3.5', 'M9 9.5h.01'],
    },
    {
        value: 'just-exploring',
        label: 'Just Exploring',
        description: 'Still learning how it all works',
        icon: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16', 'M14.5 9.5l-1.5 5-5 1.5 1.5-5z'],
    },
]

export const CONTENT_TYPES = [
    {
        value: 'market-news',
        label: 'Market News',
        icon: ['M4.5 6.5h12v12h-12z', 'M16.5 9.5h3v7a2 2 0 0 1-2 2h-1', 'M7 9.5h7', 'M7 12.5h7', 'M7 15.5h4'],
    },
    {
        value: 'charts',
        label: 'Charts',
        icon: ['M4.5 19.5h15', 'M7.5 16.5v-5', 'M12 16.5v-9', 'M16.5 16.5v-7'],
    },
    {
        value: 'social',
        label: 'Social',
        icon: ['M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6', 'M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5', 'M16 6.5a3 3 0 0 1 0 5.8', 'M17 14.6c2 .7 3.5 2.3 3.5 4.4'],
    },
    {
        value: 'fun',
        label: 'Fun',
        icon: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16', 'M9 10h.01', 'M15 10h.01', 'M8.5 14a4.5 4.5 0 0 0 7 0'],
    },
]

// Both return null for a value we no longer support, so callers can fall back
export function getInvestorType(value) {
    return INVESTOR_TYPES.find(investorType => investorType.value === value) || null
}

export function getContentType(value) {
    return CONTENT_TYPES.find(contentType => contentType.value === value) || null
}
