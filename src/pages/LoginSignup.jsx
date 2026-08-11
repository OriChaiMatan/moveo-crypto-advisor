import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../services/user.service'

// A decorative candle sequence: [open, close, high, low].
// Each candle opens where the previous one closed, and the last candle closes
// back at the first candle's open, so the sequence can repeat without a jump.
const CHART_SEQUENCE = [
    // Quiet range
    [140, 142, 143, 139],
    [142, 141, 144, 140],
    [141, 143, 144, 140],
    [143, 140, 144, 139],
    [140, 141, 142, 138],
    [141, 144, 145, 140],
    [144, 142, 146, 141],
    [142, 143, 144, 140],
    // Selloff, ending on a capitulation wick
    [143, 136, 144, 135],
    [136, 128, 137, 126],
    [128, 130, 132, 127],
    [130, 118, 131, 116],
    [118, 110, 119, 106],
    [110, 106, 112, 101],
    // Recovery
    [106, 114, 116, 105],
    [114, 112, 117, 110],
    [112, 121, 122, 111],
    [121, 119, 124, 118],
    [119, 127, 128, 118],
    [127, 132, 134, 126],
    // Choppy pullback
    [132, 128, 133, 126],
    [128, 130, 131, 126],
    [130, 124, 131, 122],
    [124, 126, 128, 122],
    [126, 123, 127, 120],
    [123, 127, 128, 121],
    // Breakout
    [127, 134, 135, 126],
    [134, 133, 137, 132],
    [133, 145, 146, 132],
    [145, 143, 148, 142],
    [143, 155, 157, 142],
    [155, 152, 158, 150],
    [152, 165, 166, 151],
    [165, 176, 180, 164],
    // Consolidation
    [176, 173, 178, 172],
    [173, 175, 177, 171],
    [175, 174, 178, 172],
    [174, 177, 178, 173],
    [177, 175, 179, 174],
    [175, 176, 177, 172],
    [176, 173, 177, 172],
    [173, 175, 176, 171],
    // Pullback inside the trend
    [175, 168, 176, 167],
    [168, 164, 169, 161],
    [164, 166, 168, 163],
    [166, 158, 167, 156],
    [158, 153, 159, 150],
    [153, 157, 158, 151],
    // Second leg up into a blow-off wick
    [157, 166, 167, 156],
    [166, 178, 179, 165],
    [178, 176, 182, 175],
    [176, 188, 190, 175],
    [188, 192, 196, 187],
    [192, 183, 193, 181],
    [183, 187, 189, 182],
    // Volatile range
    [187, 176, 188, 174],
    [176, 185, 187, 175],
    [185, 172, 186, 170],
    [172, 180, 182, 171],
    [180, 171, 181, 168],
    [171, 178, 180, 170],
    [178, 169, 179, 167],
    // Selloff
    [169, 160, 170, 158],
    [160, 162, 164, 158],
    [162, 150, 163, 148],
    [150, 143, 151, 140],
    [143, 145, 147, 141],
    [145, 133, 146, 130],
    // Recovery back into the quiet range the sequence started from
    [133, 128, 134, 124],
    [128, 135, 136, 127],
    [135, 133, 137, 131],
    [133, 139, 140, 132],
    [139, 137, 142, 136],
    [137, 142, 143, 136],
    [142, 140, 144, 138],
]

// Two identical copies, so the group can scroll one chart width and start over
const CHART_CANDLES = [...CHART_SEQUENCE, ...CHART_SEQUENCE]
const CANDLE_STEP = 8 // 75 candles fill the 600-unit chart width
const CANDLE_WIDTH = 5
const CANDLE_BASE_Y = 232 // where the lowest price sits in the viewBox
const CANDLE_LOW_PRICE = 100
const CANDLE_SCALE = 2.1 // viewBox units per price point

function priceToY(price) {
    return +(CANDLE_BASE_Y - (price - CANDLE_LOW_PRICE) * CANDLE_SCALE).toFixed(1)
}

export function LoginSignup() {

    const [isSignup, setIsSignup] = useState(false)
    const [credentials, setCredentials] = useState({ name: '', email: '', password: '' })
    const [errorMsg, setErrorMsg] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isPasswordShown, setIsPasswordShown] = useState(false)
    const [loggedinUser, setLoggedinUser] = useState(userService.getLoggedinUser())

    const navigate = useNavigate()

    function handleChange({ target }) {
        const { name, value } = target
        setCredentials(prevCredentials => ({ ...prevCredentials, [name]: value }))
    }

    function toggleMode() {
        setIsSignup(prevIsSignup => !prevIsSignup)
        setCredentials({ name: '', email: '', password: '' })
        setIsPasswordShown(false)
        setErrorMsg('')
    }

    async function onSubmit(ev) {
        ev.preventDefault()
        if (isLoading) return

        setIsLoading(true)
        setErrorMsg('')

        try {
            const user = isSignup
                ? await userService.signup(credentials)
                : await userService.login(credentials)
            setLoggedinUser(user)
            setCredentials({ name: '', email: '', password: '' })
            navigate(user.onboardingCompleted ? '/dashboard' : '/onboarding')
        } catch (err) {
            console.log('Authentication failed:', err)
            setErrorMsg(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="login-signup">

            <section className="branding">
                <div className="branding-content">
                    <div className="brand">
                        <span className="brand-mark" aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                                <polyline points="3,16 9,10 13,13 21,5" />
                            </svg>
                        </span>
                        <span className="brand-name">Crypto Advisor</span>
                    </div>

                    <h1 className="branding-title">Your market, read for you every morning.</h1>
                    <p className="branding-text">
                        Tell us which assets you follow and how you invest, and get an AI-curated
                        daily briefing built around your portfolio instead of the whole market.
                    </p>

                    <div className="chart-panel" aria-hidden="true">
                        <svg className="chart" viewBox="0 0 600 260">
                            <g className="chart-grid">
                                <line x1="0" y1="52" x2="600" y2="52" />
                                <line x1="0" y1="104" x2="600" y2="104" />
                                <line x1="0" y1="156" x2="600" y2="156" />
                                <line x1="0" y1="208" x2="600" y2="208" />
                                <line x1="150" y1="0" x2="150" y2="260" />
                                <line x1="300" y1="0" x2="300" y2="260" />
                                <line x1="450" y1="0" x2="450" y2="260" />
                            </g>

                            <g className="chart-scroll">
                                {CHART_CANDLES.map(([open, close, high, low], idx) => {
                                    const x = idx * CANDLE_STEP + CANDLE_STEP / 2
                                    const bodyTop = priceToY(Math.max(open, close))
                                    const bodyHeight = Math.max(priceToY(Math.min(open, close)) - bodyTop, 1.5)

                                    return (
                                        <g key={idx} className={`candle ${close >= open ? 'is-up' : 'is-down'}`}>
                                            <line
                                                className="candle-wick"
                                                x1={x}
                                                y1={priceToY(high)}
                                                x2={x}
                                                y2={priceToY(low)}
                                            />
                                            <rect
                                                className="candle-body"
                                                x={x - CANDLE_WIDTH / 2}
                                                y={bodyTop}
                                                width={CANDLE_WIDTH}
                                                height={bodyHeight}
                                            />
                                        </g>
                                    )
                                })}
                            </g>
                        </svg>
                    </div>
                </div>
            </section>

            <section className="auth">
                <div className="auth-card">
                    <h2 className="auth-title">{isSignup ? 'Create your account' : 'Welcome back'}</h2>
                    <p className="auth-subtitle">
                        {isSignup
                            ? 'A few quick questions and your dashboard is ready.'
                            : 'Log in to see today’s personalized briefing.'}
                    </p>

                    <form className="auth-form" onSubmit={onSubmit}>
                        {isSignup && (
                            <div className="form-field">
                                <label htmlFor="name">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    placeholder="Your name"
                                    autoComplete="name"
                                    value={credentials.name}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        <div className="form-field">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                value={credentials.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <div className="field-header">
                                <label htmlFor="password">Password</label>
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setIsPasswordShown(prevIsShown => !prevIsShown)}
                                >
                                    {isPasswordShown ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            <input
                                type={isPasswordShown ? 'text' : 'password'}
                                id="password"
                                name="password"
                                placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
                                autoComplete={isSignup ? 'new-password' : 'current-password'}
                                value={credentials.password}
                                onChange={handleChange}
                            />
                        </div>

                        {errorMsg && <p className="auth-msg error" role="alert">{errorMsg}</p>}

                        <button type="submit" className="btn-primary" disabled={isLoading}>
                            {isLoading
                                ? 'Please wait...'
                                : isSignup ? 'Create account' : 'Log in'}
                        </button>
                    </form>

                    {loggedinUser && (
                        <p className="auth-msg success">Logged in as {loggedinUser.name}</p>
                    )}

                    <p className="auth-switch">
                        {isSignup ? 'Already have an account?' : 'New to Crypto Advisor?'}
                        <button type="button" className="link-btn" onClick={toggleMode} disabled={isLoading}>
                            {isSignup ? 'Log in' : 'Create an account'}
                        </button>
                    </p>
                </div>
            </section>

        </main>
    )
}
