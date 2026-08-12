import { authService } from '../api/auth/auth.service.js'
import { config } from '../config/index.js'

// Verifies the login cookie and attaches the identity from the token.
// It does not read the database: routes that need the full user load it themselves.
export function requireAuth(req, res, next) {
    const loggedinUser = _getTokenUser(req)

    if (!loggedinUser) return res.status(401).send({ err: 'Not authenticated' })

    req.loggedinUser = loggedinUser
    next()
}

// For the one route that asks "is anybody logged in?". Having no session is a
// normal answer there, not a failure, so it continues with no user attached.
export function optionalAuth(req, res, next) {
    req.loggedinUser = _getTokenUser(req)
    next()
}

// The identity inside the login cookie, or null when it is missing or no longer valid
function _getTokenUser(req) {
    const token = req.cookies?.[config.cookieName]
    return token ? authService.validateToken(token) : null
}
