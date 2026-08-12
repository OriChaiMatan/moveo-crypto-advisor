import { httpService } from './http.service'

// A thin client for our own dashboard api. Every third party integration, all
// personalization and every fallback now lives on the server, so this file only
// knows which endpoint answers which section.
export const dashboardService = {
    getNews,
    getCoinData,
    getCoinHistory,
    getInsight,
    getMeme,
    getFeedback,
    saveFeedback,
    removeFeedback,
}

/* ---------- Meme ---------- */

// The server calls the meme API and picks one of our own when it cannot
async function getMeme() {
    return httpService.get('/dashboard/meme')
}

/* ---------- AI insight ---------- */

// The server owns the prompt, the OpenRouter call, the daily persistence and the
// local fallback. Only the browser's calendar day is sent, because only the
// browser knows which day the user is having.
async function getInsight(date) {
    return httpService.get(`/dashboard/insight?date=${date}`)
}

/* ---------- Coins ---------- */

// The server holds the CoinGecko integration and reads the selected assets from
// the logged in user, so nothing about the request is decided here.
async function getCoinData() {
    return httpService.get('/dashboard/coins')
}

// The signal lets the caller drop a request that a newer coin replaced
async function getCoinHistory(coinId, days, signal) {
    return httpService.get(`/dashboard/coins/${coinId}/history?days=${days}`, signal)
}

/* ---------- News ---------- */

// The server holds the NewsData integration, the relevance filtering and the
// investor ranking, and reads the assets from the logged in user
async function getNews() {
    return httpService.get('/dashboard/news')
}

/* ---------- Feedback ---------- */

// Feedback lives in the database. The server knows who is asking from the login
// cookie, so none of these send a user id, and it derives the content key itself.
async function getFeedback(section, contentIds) {
    return httpService.get(`/feedback?${_getContentParams(section, contentIds)}`)
}

async function saveFeedback({ section, contentIds, source, vote, context, snapshot }) {
    return httpService.post('/feedback', { section, contentIds, source, vote, context, snapshot })
}

// Removes the vote on this content state only, never the rest of the history
async function removeFeedback(section, contentIds) {
    await httpService.delete(`/feedback?${_getContentParams(section, contentIds)}`)
}

// The ids are repeated rather than joined into one value, so an id that contains
// a comma or an ampersand still arrives intact
function _getContentParams(section, contentIds) {
    const params = new URLSearchParams({ section })
    contentIds.forEach(contentId => params.append('contentIds', contentId))

    return params
}
