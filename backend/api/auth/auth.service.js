import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import { userService } from '../user/user.service.js'
import { config } from '../../config/index.js'

const SALT_ROUNDS = 10
const TOKEN_EXPIRY = '7d'
const MIN_PASSWORD_LENGTH = 8
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

export const authService = {
    signup,
    login,
    getLoginToken,
    validateToken,
}

async function signup({ name, email, password }) {
    if (!name || !email || !password) throw _clientError('Please fill in all the fields')

    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedName) throw _clientError('Please fill in all the fields')
    if (!EMAIL_PATTERN.test(normalizedEmail)) throw _clientError('Please enter a valid email address')
    if (password.length < MIN_PASSWORD_LENGTH) throw _clientError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)

    const existingUser = await userService.getByEmail(normalizedEmail)
    if (existingUser) throw _clientError('A user with this email already exists')

    const hash = await bcrypt.hash(password, SALT_ROUNDS)

    try {
        const user = await userService.add({ name: normalizedName, email: normalizedEmail, password: hash })
        return userService.toSafeUser(user)
    } catch (err) {
        // The check above cannot see a signup that is still in flight, so the
        // unique index is what actually guarantees one account per email
        if (err.isDuplicateEmail) throw _clientError('A user with this email already exists')
        throw err
    }
}

async function login({ email, password }) {
    // The same message for every failure, so the api never reveals which
    // emails are registered
    const invalidCredentials = _clientError('Invalid email or password', 401)

    if (!email || !password) throw invalidCredentials

    const user = await userService.getByEmail(email.trim().toLowerCase())
    if (!user) throw invalidCredentials

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw invalidCredentials

    return userService.toSafeUser(user)
}

// Only identity goes into the token. Everything else is read from the database,
// so a token issued yesterday can never carry yesterday's preferences.
function getLoginToken(user) {
    const payload = { _id: String(user._id), email: user.email }
    return jwt.sign(payload, config.jwtSecret, { expiresIn: TOKEN_EXPIRY })
}

// Returns null for a missing, expired or tampered token
function validateToken(token) {
    try {
        const { _id, email } = jwt.verify(token, config.jwtSecret)
        return { _id, email }
    } catch {
        return null
    }
}

// An error the client is allowed to read, with the status the controller answers.
// Anything without a status is unexpected and answered as a 500.
function _clientError(message, status = 400) {
    const err = new Error(message)
    err.status = status
    return err
}
