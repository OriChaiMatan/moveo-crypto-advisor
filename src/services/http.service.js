// The one place that knows where the backend is and how to talk to it.
// Every request sends the login cookie, which the browser holds as HttpOnly.
//
// In production the same server serves this app and the api, so a relative path
// reaches it. In development they run on two ports, so the api is named in full.
const BASE_URL = import.meta.env.VITE_API_URL
    || (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api')

export const httpService = {
    // The signal lets a caller drop a request that a newer one replaced
    get(endpoint, signal) {
        return _request('GET', endpoint, undefined, signal)
    },
    post(endpoint, body) {
        return _request('POST', endpoint, body)
    },
    put(endpoint, body) {
        return _request('PUT', endpoint, body)
    },
    delete(endpoint) {
        return _request('DELETE', endpoint)
    },
}

async function _request(method, endpoint, body, signal) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        credentials: 'include', // without this the browser leaves the cookie behind
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal,
    })

    const data = await _readBody(res)

    if (!res.ok) {
        // The server answers with { err } holding a message the user can read
        const err = new Error(data?.err || `Request failed with status ${res.status}`)
        err.status = res.status // so callers can tell a 401 from a real failure
        throw err
    }

    return data
}

async function _readBody(res) {
    try {
        return await res.json()
    } catch {
        // A response without a body is fine, for example a failed request that
        // never reached our own error handler
        return null
    }
}
