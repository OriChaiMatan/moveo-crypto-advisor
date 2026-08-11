import { userService } from './user.service'

const STORAGE_KEY_PREFERENCES = 'userPreferences'

export const userPreferencesService = {
    savePreferences,
    getPreferences,
}

async function savePreferences(preferences) {
    const loggedinUser = userService.getLoggedinUser()
    if (!loggedinUser) throw new Error('No logged in user')

    const { assets, investorType, contentTypes } = preferences
    const allPreferences = _getAllPreferences()

    // A user has only one preferences record, so update it instead of adding a new one
    let savedPreferences = allPreferences.find(prefs => prefs.userId === loggedinUser._id)

    if (savedPreferences) {
        savedPreferences.assets = assets
        savedPreferences.investorType = investorType
        savedPreferences.contentTypes = contentTypes
    } else {
        savedPreferences = {
            _id: 'pref' + Date.now(),
            userId: loggedinUser._id,
            assets,
            investorType,
            contentTypes,
        }
        allPreferences.push(savedPreferences)
    }

    localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(allPreferences))

    return savedPreferences
}

async function getPreferences(userId) {
    const allPreferences = _getAllPreferences()
    return allPreferences.find(prefs => prefs.userId === userId) || null
}

function _getAllPreferences() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_PREFERENCES)) || []
}
