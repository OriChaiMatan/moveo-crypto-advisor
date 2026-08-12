import { authService } from './auth.service.js'
import { config } from '../../config/index.js'
import { logger } from '../../services/logger.service.js'

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // matches the token expiry

export async function signup(req, res) {
    try {
        const user = await authService.signup(req.body)
        _setLoginCookie(res, authService.getLoginToken(user))

        logger.info('New user signed up:', String(user._id))
        res.json(user)
    } catch (err) {
        _sendError(res, err, 'Signup failed')
    }
}

export async function login(req, res) {
    try {
        const user = await authService.login(req.body)
        _setLoginCookie(res, authService.getLoginToken(user))

        logger.info('User logged in:', String(user._id))
        res.json(user)
    } catch (err) {
        _sendError(res, err, 'Login failed')
    }
}

export function logout(req, res) {
    // Clearing needs the same options the cookie was written with, otherwise
    // the browser keeps it
    res.clearCookie(config.cookieName, config.cookie)
    res.send({ msg: 'Logged out successfully' })
}

function _setLoginCookie(res, token) {
    res.cookie(config.cookieName, token, { ...config.cookie, maxAge: COOKIE_MAX_AGE })
}

// Expected failures carry a status and a message the client may read.
// Anything else is a server problem, and only a generic message goes out.
function _sendError(res, err, fallbackMessage) {
    if (err.status) {
        logger.warn(`${fallbackMessage}:`, err.message)
        return res.status(err.status).send({ err: err.message })
    }

    // The request body holds a password, so only the error message is logged
    logger.error(`${fallbackMessage}:`, err.message)
    res.status(500).send({ err: fallbackMessage })
}
