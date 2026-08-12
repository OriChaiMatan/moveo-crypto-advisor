import { MongoClient } from 'mongodb'

import { config } from '../config/index.js'
import { logger } from './logger.service.js'

export const dbService = {
    getCollection,
}

// The pending connection is kept, not just the finished one, so requests that
// arrive together share it instead of each opening a second client
let dbPromise = null

async function getCollection(collectionName) {
    const db = await _connect()
    return db.collection(collectionName)
}

async function _connect() {
    if (!dbPromise) dbPromise = _createConnection()
    return dbPromise
}

async function _createConnection() {
    try {
        const client = await MongoClient.connect(config.dbUrl)
        // The url carries the credentials, so only the database name is logged
        logger.info(`Connected to the database: ${config.dbName}`)

        return client.db(config.dbName)
    } catch (err) {
        dbPromise = null // so the next request can try again
        logger.error('Cannot connect to the database:', err.message)
        throw err
    }
}
