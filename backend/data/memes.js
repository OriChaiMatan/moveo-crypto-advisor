// Our own memes, served from the frontend's public folder. Shown when the meme
// API is unavailable. They have no postUrl or subreddit, so the client renders
// no Reddit source line for them.
export const FALLBACK_MEMES = [
    {
        id: 'fallback-buy-the-dip',
        title: 'Buy the dip',
        imageUrl: '/memes/buy-the-dip.svg',
        postUrl: null,
        subreddit: null,
    },
    {
        id: 'fallback-portfolio-up',
        title: 'Portfolio +2%',
        imageUrl: '/memes/portfolio-up-2-percent.svg',
        postUrl: null,
        subreddit: null,
    },
    {
        id: 'fallback-hodl',
        title: 'HODL',
        imageUrl: '/memes/hodl.svg',
        postUrl: null,
        subreddit: null,
    },
    {
        id: 'fallback-btc-moves',
        title: 'BTC moves 1%',
        imageUrl: '/memes/btc-moves-one-percent.svg',
        postUrl: null,
        subreddit: null,
    },
]
