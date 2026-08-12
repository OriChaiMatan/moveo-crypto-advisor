const STORAGE_KEY_USERS = 'users'
const STORAGE_KEY_LOGGEDIN_USER = 'loggedinUser'

export const userService = {
    signup,
    login,
    logout,
    getLoggedinUser,
    completeOnboarding,
}

async function signup(userCred) {
    const { name, email, password } = userCred

    if (!name || !email || !password) throw new Error('Please fill in all the fields')

    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new Error('Please enter a valid email address')
    if (password.length < 8) throw new Error('Password must be at least 8 characters')

    const users = _getUsers()
    const existingUser = users.find(user => user.email === normalizedEmail)
    if (existingUser) throw new Error('A user with this email already exists')

    const user = {
        _id: 'u' + Date.now(),
        name: normalizedName,
        email: normalizedEmail,
        password,
        onboardingCompleted: false,
    }

    users.push(user)
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users))

    return _saveLocalUser(user)
}

async function login(userCred) {
    const { email, password } = userCred

    if (!email || !password) throw new Error('Please fill in all the fields')

    const normalizedEmail = email.trim().toLowerCase()

    const users = _getUsers()
    const user = users.find(user => user.email === normalizedEmail && user.password === password)
    if (!user) throw new Error('Incorrect email or password')

    return _saveLocalUser(user)
}

async function completeOnboarding() {
    const loggedinUser = getLoggedinUser()
    if (!loggedinUser) throw new Error('No logged in user')

    const users = _getUsers()
    const user = users.find(user => user._id === loggedinUser._id)
    if (!user) throw new Error('User not found')

    user.onboardingCompleted = true
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users))

    return _saveLocalUser(user)
}

async function logout() {
    sessionStorage.removeItem(STORAGE_KEY_LOGGEDIN_USER)
}

// Read during render, so a corrupted value must return null instead of throwing
function getLoggedinUser() {
    try {
        const loggedinUser = JSON.parse(sessionStorage.getItem(STORAGE_KEY_LOGGEDIN_USER))
        // Nothing stored is the normal logged out state, and stays quiet
        if (loggedinUser === null) return null

        if (typeof loggedinUser !== 'object' || Array.isArray(loggedinUser)) {
            console.error('Ignoring stored logged in user: expected an object')
            return null
        }

        return loggedinUser
    } catch {
        console.error('Ignoring stored logged in user: not valid JSON')
        return null
    }
}

function _saveLocalUser(user) {
    const userToSave = {
        _id: user._id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
    }
    sessionStorage.setItem(STORAGE_KEY_LOGGEDIN_USER, JSON.stringify(userToSave))
    return userToSave
}

function _getUsers() {
    try {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS))
        if (!Array.isArray(users)) {
            // Nothing stored yet is the normal first visit, and stays quiet
            if (users !== null) console.error('Ignoring stored users: expected an array')
            return []
        }

        return users
    } catch {
        // The parse error quotes the stored text, which holds passwords, so it is not logged
        console.error('Ignoring stored users: not valid JSON')
        return []
    }
}
