import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginSignup } from './pages/LoginSignup.jsx'
import { Onboarding } from './pages/Onboarding.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { userService } from './services/user.service'

// Where a user belongs right now. Setting or clearing the logged in user is
// what moves them, so no page has to navigate after logging in or out.
function getHomePath(loggedinUser) {
    if (!loggedinUser) return '/login'
    return loggedinUser.onboardingCompleted ? '/dashboard' : '/onboarding'
}

// Onboarding and the dashboard are two halves of the same rule: you have to be
// logged in, and you have to be on the right side of onboarding.
function RequireAuth({ loggedinUser, needsOnboarding = false, children }) {
    if (!loggedinUser) return <Navigate to="/login" replace />

    const isInTheRightPlace = needsOnboarding
        ? !loggedinUser.onboardingCompleted
        : loggedinUser.onboardingCompleted
    if (!isInTheRightPlace) return <Navigate to={getHomePath(loggedinUser)} replace />

    return children
}

function App() {

    const [loggedinUser, setLoggedinUser] = useState(null)
    const [isAuthLoading, setIsAuthLoading] = useState(true)

    // The cookie is HttpOnly, so the only way to know who is logged in is to ask
    useEffect(() => {
        restoreSession()

        async function restoreSession() {
            try {
                setLoggedinUser(await userService.getLoggedinUser())
            } catch (err) {
                // A network or server problem, not a logged out user
                console.error('Restoring the session failed:', err.message)
            } finally {
                setIsAuthLoading(false)
            }
        }
    }, [])

    async function onLogout() {
        try {
            await userService.logout()
        } catch (err) {
            console.error('Logging out failed:', err.message)
        }
        // The user is cleared either way, so a failed request cannot strand them
        setLoggedinUser(null)
    }

    // No route is rendered before the session is known, so a logged in user
    // never sees the login page flash on the way to the dashboard
    if (isAuthLoading) {
        return (
            <main className="app-loader" aria-busy="true">
                <span className="brand-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                        <polyline points="3,16 9,10 13,13 21,5" />
                    </svg>
                </span>
                <p>Loading your dashboard...</p>
            </main>
        )
    }

    return (
        <Routes>
            <Route path="/" element={<Navigate to={getHomePath(loggedinUser)} replace />} />

            <Route
                path="/login"
                element={loggedinUser
                    ? <Navigate to={getHomePath(loggedinUser)} replace />
                    : <LoginSignup onAuth={setLoggedinUser} />}
            />

            <Route
                path="/onboarding"
                element={
                    <RequireAuth loggedinUser={loggedinUser} needsOnboarding>
                        <Onboarding onPreferencesSaved={setLoggedinUser} />
                    </RequireAuth>
                }
            />

            <Route
                path="/dashboard"
                element={
                    <RequireAuth loggedinUser={loggedinUser}>
                        <Dashboard loggedinUser={loggedinUser} onLogout={onLogout} />
                    </RequireAuth>
                }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
