import { httpService } from './http.service'

// The backend is the only source of truth for who is logged in. The token lives
// in an HttpOnly cookie, so this file never sees it and never stores a user.
export const userService = {
    signup,
    login,
    logout,
    getLoggedinUser,
}

async function signup({ name, email, password }) {
    return httpService.post('/auth/signup', { name, email, password })
}

async function login({ email, password }) {
    return httpService.post('/auth/login', { email, password })
}

async function logout() {
    await httpService.post('/auth/logout')
}

// Returns null when there is no session. Being logged out is a normal answer
// here, not a failure, so only real problems are passed on to the caller.
async function getLoggedinUser() {
    try {
        return await httpService.get('/user')
    } catch (err) {
        if (err.status === 401) return null
        throw err
    }
}
