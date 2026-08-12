// The one place environment variables are loaded, so nothing else calls dotenv
import 'dotenv/config'

import configDev from './dev.js'
import configProd from './prod.js'

const isProduction = process.env.NODE_ENV === 'production'

// This object holds secrets. Never log it.
export const config = {
    ...(isProduction ? configProd : configDev),
    isProduction,
    port: process.env.PORT || 5001,
    dbUrl: process.env.DB_URL,
    dbName: process.env.DB_NAME || 'crypto-advisor',
    jwtSecret: process.env.JWT_SECRET,
    cookieName: 'loginToken',
    // Third party keys. None is required to boot: every section has a fallback,
    // so a missing key degrades one section instead of stopping the server.
    coinGeckoApiKey: process.env.COINGECKO_API_KEY,
    newsDataApiKey: process.env.NEWSDATA_API_KEY,
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
}

// Missing secrets fail here rather than as a confusing error on the first
// request. There is deliberately no fallback secret to fall back to.
const missing = ['DB_URL', 'JWT_SECRET'].filter(name => !process.env[name])
if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill it in.`)
}
