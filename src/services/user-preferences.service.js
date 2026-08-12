import { httpService } from './http.service'

// Preferences live on the user document, so saving them returns the whole
// updated user. There is no getPreferences: the logged in user already carries
// them, and asking again would be a second request for data we hold.
export const userPreferencesService = {
    savePreferences,
}

async function savePreferences({ assets, investorType, contentTypes }) {
    return httpService.put('/user/preferences', { assets, investorType, contentTypes })
}
