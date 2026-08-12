import { ObjectId } from 'mongodb'

import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'

const COLLECTION_NAME = 'feedback'

export const feedbackService = {
    getByContent,
    save,
    remove,
    getContentKey,
    createIndexes,
}

// One record per user, section and content state. The index is what guarantees
// it, so two clicks arriving together cannot create two records for one state.
async function createIndexes() {
    const collection = await dbService.getCollection(COLLECTION_NAME)
    await collection.createIndex({ userId: 1, section: 1, contentKey: 1 }, { unique: true })

    logger.info('Feedback indexes are in place')
}

// A short, stable name for one content state. Sorted first, so the same items in
// a different order stay the same state. The real ids are kept in the snapshot.
function getContentKey(contentIds) {
    return _hash([...contentIds].sort().join('|'))
}

// FNV-1a, 32 bit. Short and deterministic, and needs no library.
function _hash(text) {
    let hash = 2166136261

    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i)
        hash = Math.imul(hash, 16777619)
    }

    return (hash >>> 0).toString(36)
}

async function getByContent(userId, section, contentKey) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        return await collection.findOne(_getFilter(userId, section, contentKey))
    } catch (err) {
        logger.error('Cannot find the feedback:', err.message)
        throw err
    }
}

// Voting again on the same content updates that one record. Voting on content
// the user has not seen before adds another, so the history is never overwritten.
async function save({ userId, section, contentKey, vote, source, contentSnapshot }) {
    const now = new Date()

    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)

        // The upsert takes userId, section and contentKey from the filter, so the
        // three fields that identify a record are never written from the body
        return await collection.findOneAndUpdate(
            _getFilter(userId, section, contentKey),
            {
                $set: { vote, source, contentSnapshot, updatedAt: now },
                $setOnInsert: { createdAt: now },
            },
            { upsert: true, returnDocument: 'after' },
        )
    } catch (err) {
        logger.error('Cannot save the feedback:', err.message)
        throw err
    }
}

// Removes the vote on this content state only, never the rest of the history
async function remove(userId, section, contentKey) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const { deletedCount } = await collection.deleteOne(_getFilter(userId, section, contentKey))

        return deletedCount
    } catch (err) {
        logger.error('Cannot remove the feedback:', err.message)
        throw err
    }
}

// Every query is scoped to the caller, so one user can never reach another's votes
function _getFilter(userId, section, contentKey) {
    return { userId: new ObjectId(userId), section, contentKey }
}
