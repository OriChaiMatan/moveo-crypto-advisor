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

// Returns the logged in user, or null when nobody is logged in. The server
// answers both with 200, so only a real problem reaches the caller.
async function getLoggedinUser() {
    return httpService.get('/user')
}
