import { authService } from '../api/auth/auth.service.js'
import { config } from '../config/index.js'

// Verifies the login cookie and attaches the identity from the token.
// It does not read the database: routes that need the full user load it themselves.
export function requireAuth(req, res, next) {
    const token = req.cookies?.[config.cookieName]
    const loggedinUser = token ? authService.validateToken(token) : null

    if (!loggedinUser) return res.status(401).send({ err: 'Not authenticated' })

    req.loggedinUser = loggedinUser
    next()
}
