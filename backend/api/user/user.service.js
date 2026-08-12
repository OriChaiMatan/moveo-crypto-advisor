import { ObjectId } from 'mongodb'

import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'

const COLLECTION_NAME = 'users'
const DUPLICATE_KEY_ERROR = 11000

export const userService = {
    add,
    getById,
    getByEmail,
    updatePreferences,
    toSafeUser,
    createIndexes,
}

// Emails are stored lowercased, so a plain unique index is enough to keep one
// account per address. createIndex does nothing when the index already exists,
// so this is safe to run on every start and needs no migration step.
async function createIndexes() {
    const collection = await dbService.getCollection(COLLECTION_NAME)
    await collection.createIndex({ email: 1 }, { unique: true })

    logger.info('User indexes are in place')
}

// The one place that decides which fields the client may see. Everything that
// reaches a response goes through here, so the password hash cannot leak.
function toSafeUser(user) {
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        preferences: user.preferences,
    }
}

// The password arrives already hashed, so this service never sees a plain one
async function add({ name, email, password }) {
    const now = new Date()

    const user = {
        name,
        email,
        password,
        onboardingCompleted: false,
        // Preferences live on the user, filled in by onboarding later
        preferences: { assets: [], investorType: '', contentTypes: [] },
        createdAt: now,
        updatedAt: now,
    }

    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        await collection.insertOne(user) // insertOne adds the _id to the object

        return user
    } catch (err) {
        // Two signups with the same email at the same moment both pass the check
        // in the auth service, and the unique index rejects the second one here.
        // The mongo error stays in this file, the caller only sees the flag.
        if (err.code === DUPLICATE_KEY_ERROR) {
            const duplicateErr = new Error('Duplicate email')
            duplicateErr.isDuplicateEmail = true
            throw duplicateErr
        }

        logger.error('Cannot add a user:', err.message)
        throw err
    }
}

async function getById(userId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        return await collection.findOne({ _id: new ObjectId(userId) })
    } catch (err) {
        logger.error(`Cannot find the user by id ${userId}:`, err.message)
        throw err
    }
}

// Finishing onboarding is the same action as saving the first preferences,
// so both fields are written together. Only these three fields are ever
// written, so the client cannot reach any other part of the document.
async function updatePreferences(userId, { assets, investorType, contentTypes }) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)

        return await collection.findOneAndUpdate(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    preferences: { assets, investorType, contentTypes },
                    onboardingCompleted: true,
                    updatedAt: new Date(),
                },
            },
            { returnDocument: 'after' },
        )
    } catch (err) {
        logger.error(`Cannot update the preferences of user ${userId}:`, err.message)
        throw err
    }
}

// Returns the full document, including the hash, because logging in needs it
async function getByEmail(email) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        return await collection.findOne({ email })
    } catch (err) {
        // The email is not logged, it is part of the credentials being checked
        logger.error('Cannot find the user by email:', err.message)
        throw err
    }
}
