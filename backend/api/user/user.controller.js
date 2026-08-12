import { userService } from './user.service.js'
import { logger } from '../../services/logger.service.js'
import { ASSET_VALUES } from '../../data/assets.js'

// The answers onboarding is allowed to send. The assets come from the server's
// own catalogue, the rest are listed here: the api cannot trust the client to
// send only what its own screens offer.
const VALID_INVESTOR_TYPES = ['hodler', 'day-trader', 'nft-collector', 'just-exploring']
const VALID_CONTENT_TYPES = ['market-news', 'charts', 'social', 'fun']

// The client only ever asks for itself, so the id comes from the verified
// token rather than from the request
export async function getLoggedinUser(req, res) {
    try {
        const user = await userService.getById(req.loggedinUser._id)
        if (!user) return res.status(404).send({ err: 'User not found' })

        res.json(userService.toSafeUser(user))
    } catch (err) {
        logger.error('Failed to get the logged in user:', err.message)
        res.status(500).send({ err: 'Failed to get user' })
    }
}

export async function updatePreferences(req, res) {
    const validationError = _getValidationError(req.body)
    if (validationError) return res.status(400).send({ err: validationError })

    try {
        // The id comes from the token, never from the body
        const user = await userService.updatePreferences(req.loggedinUser._id, req.body)
        if (!user) return res.status(404).send({ err: 'User not found' })

        logger.info('Preferences saved for user:', String(user._id))
        res.json(userService.toSafeUser(user))
    } catch (err) {
        logger.error('Failed to save preferences:', err.message)
        res.status(500).send({ err: 'Failed to save preferences' })
    }
}

// Returns a message the client can show, or null when the body is fine
function _getValidationError({ assets, investorType, contentTypes } = {}) {
    if (!Array.isArray(assets) || !assets.length) return 'Please select at least one asset'
    if (assets.some(asset => !ASSET_VALUES.includes(asset))) return 'One of the selected assets is not supported'

    if (typeof investorType !== 'string') return 'Please select an investor type'
    if (!VALID_INVESTOR_TYPES.includes(investorType)) return 'The selected investor type is not supported'

    if (!Array.isArray(contentTypes) || !contentTypes.length) return 'Please select at least one content type'
    if (contentTypes.some(contentType => !VALID_CONTENT_TYPES.includes(contentType))) return 'One of the selected content types is not supported'

    return null
}
