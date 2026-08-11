const STORAGE_KEY_USERS = 'users'
const STORAGE_KEY_LOGGEDIN_USER = 'loggedinUser'

export const userService = {
    signup,
    login,
    logout,
    getLoggedinUser,
    saveLocalUser,
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

    return saveLocalUser(user)
}

async function login(userCred) {
    const { email, password } = userCred

    if (!email || !password) throw new Error('Please fill in all the fields')

    const normalizedEmail = email.trim().toLowerCase()

    const users = _getUsers()
    const user = users.find(user => user.email === normalizedEmail && user.password === password)
    if (!user) throw new Error('Incorrect email or password')

    return saveLocalUser(user)
}

async function logout() {
    sessionStorage.removeItem(STORAGE_KEY_LOGGEDIN_USER)
}

function getLoggedinUser() {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY_LOGGEDIN_USER))
}

function saveLocalUser(user) {
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
    return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS)) || []
}
