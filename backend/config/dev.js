// Local development: the frontend runs on the Vite dev server, on a different
// origin than this server, so the cookie is a plain same-site cookie over http.
export default {
    clientUrls: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean),
    cookie: {
        httpOnly: true,
        secure: false, // there is no https locally
        sameSite: 'lax',
        path: '/',
    },
}
