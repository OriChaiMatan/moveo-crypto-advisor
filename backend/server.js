import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'

import { config } from './config/index.js'
import { logger } from './services/logger.service.js'
import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { userService } from './api/user/user.service.js'
import { feedbackRoutes } from './api/feedback/feedback.routes.js'
import { feedbackService } from './api/feedback/feedback.service.js'
import { dashboardRoutes } from './api/dashboard/dashboard.routes.js'
import { insightService } from './api/dashboard/insight.service.js'

const app = express()

app.use(cookieParser())
app.use(express.json())

if (config.isProduction) {
    // The built frontend is served from this server, so requests are same origin
    app.use(express.static(path.resolve('public')))
} else {
    // The dev server runs on another port, so the browser needs permission to
    // send the login cookie with its requests
    app.use(cors({ origin: config.clientUrls, credentials: true }))
}

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/dashboard', dashboardRoutes)

if (config.isProduction) {
    // Any address the frontend router owns is answered with the app itself
    app.get('/*splat', (req, res) => res.sendFile(path.resolve('public/index.html')))
}

// The unique indexes are what guarantee one account per email and one vote per
// content state, so the server only starts accepting requests once they exist. A
// database that is unreachable at startup stops the server rather than letting
// writes through unprotected.
async function startServer() {
    try {
        await userService.createIndexes()
        await feedbackService.createIndexes()
        await insightService.createIndexes()

        app.listen(config.port, () => {
            logger.info(`Server listening on port ${config.port} in ${config.isProduction ? 'production' : 'development'} mode`)
        })
    } catch (err) {
        // Only the message: it can name the host, never the credentials
        logger.error('Cannot start the server:', err.message)
        process.exit(1)
    }
}

startServer()
