// Deployed: the frontend may be hosted on another domain, so the cookie has to
// be allowed cross site, which browsers only accept over https.
export default {
    clientUrls: [process.env.CLIENT_URL].filter(Boolean),
    cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
    },
}
