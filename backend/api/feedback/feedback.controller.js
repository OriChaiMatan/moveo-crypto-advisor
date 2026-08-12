import { feedbackService } from './feedback.service.js'
import { logger } from '../../services/logger.service.js'

// The four dashboard sections that take feedback
const FEEDBACK_SECTIONS = ['coin-prices', 'ai-insight', 'market-news', 'crypto-meme']
const VOTES = ['up', 'down']

// Returns the caller's vote on this content, or null when they have not voted
export async function getFeedback(req, res) {
    const { section } = req.query
    const contentIds = _getContentIds(req.query)

    const validationError = _getContentError(section, contentIds)
    if (validationError) return res.status(400).send({ err: validationError })

    try {
        const contentKey = feedbackService.getContentKey(contentIds)
        const feedback = await feedbackService.getByContent(req.loggedinUser._id, section, contentKey)

        res.json(feedback)
    } catch (err) {
        logger.error('Failed to get the feedback:', err.message)
        res.status(500).send({ err: 'Failed to get feedback' })
    }
}

export async function saveFeedback(req, res) {
    const { section, contentIds, vote, source, context, snapshot } = req.body

    const validationError = _getSaveError(req.body)
    if (validationError) return res.status(400).send({ err: validationError })

    try {
        const feedback = await feedbackService.save({
            // The identity comes from the token, never from the request
            userId: req.loggedinUser._id,
            section,
            contentKey: feedbackService.getContentKey(contentIds),
            vote,
            source,
            contentSnapshot: _getContentSnapshot(contentIds, context, snapshot),
        })

        res.json(feedback)
    } catch (err) {
        logger.error('Failed to save the feedback:', err.message)
        res.status(500).send({ err: 'Failed to save feedback' })
    }
}

export async function removeFeedback(req, res) {
    const { section } = req.query
    const contentIds = _getContentIds(req.query)

    const validationError = _getContentError(section, contentIds)
    if (validationError) return res.status(400).send({ err: validationError })

    try {
        const contentKey = feedbackService.getContentKey(contentIds)
        await feedbackService.remove(req.loggedinUser._id, section, contentKey)

        // Removing a vote that is not there is not a failure, the result is the same
        res.send({ msg: 'Feedback removed' })
    } catch (err) {
        logger.error('Failed to remove the feedback:', err.message)
        res.status(500).send({ err: 'Failed to remove feedback' })
    }
}

// One id arrives as a string, several arrive as an array
function _getContentIds(query) {
    return [].concat(query.contentIds || [])
}

// What the user was looking at, kept as it was at the moment of the vote.
// A section may add its own detail, for example the market numbers on screen.
// The fields the server derives are written last, so the body cannot rewrite them.
function _getContentSnapshot(contentIds, context, snapshot) {
    return {
        ...snapshot,
        contentIds,
        assets: context.assets,
        investorType: context.investorType,
        contentTypes: context.contentTypes,
    }
}

function _getContentError(section, contentIds) {
    if (!FEEDBACK_SECTIONS.includes(section)) return 'Unknown feedback section'
    if (!contentIds.length) return 'Missing content ids'
    if (contentIds.some(contentId => typeof contentId !== 'string' || !contentId)) return 'Invalid content id'

    return null
}

function _getSaveError({ section, contentIds, vote, source, context, snapshot }) {
    const contentError = _getContentError(section, Array.isArray(contentIds) ? contentIds : [])
    if (contentError) return contentError

    if (!VOTES.includes(vote)) return 'A vote must be up or down'
    if (typeof source !== 'string' || !source) return 'Missing content source'

    // The snapshot records the preferences at the time of the vote. Only the shape
    // is checked: it describes what was shown, not what is allowed now.
    const { assets, investorType, contentTypes } = context || {}
    if (!Array.isArray(assets) || typeof investorType !== 'string' || !Array.isArray(contentTypes)) {
        return 'Invalid preferences snapshot'
    }

    // Optional, and its contents belong to the section that sent it
    if (snapshot !== undefined && (typeof snapshot !== 'object' || snapshot === null || Array.isArray(snapshot))) {
        return 'Invalid content snapshot'
    }

    return null
}
