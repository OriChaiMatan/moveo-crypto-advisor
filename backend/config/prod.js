// Deployed: one server answers both the app and the api, so every request that
// needs the cookie is same site. Keeping it lax means another site cannot make
// the browser send it along, and https is always available here.
export default {
    clientUrls: [process.env.CLIENT_URL].filter(Boolean),
    cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
    },
}
