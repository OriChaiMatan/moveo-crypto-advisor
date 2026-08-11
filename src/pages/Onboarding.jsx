import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../services/user.service'
import { userPreferencesService } from '../services/user-preferences.service'

// Every icon is a list of paths drawn in the same 24x24 box, so they stay consistent
const ASSET_OPTIONS = [
    {
        value: 'bitcoin', label: 'Bitcoin', symbol: 'BTC',
        icon: ['M9.5 7v10', 'M9.5 7h4.5a2.5 2.5 0 0 1 0 5h-4.5', 'M9.5 12h5a2.5 2.5 0 0 1 0 5h-5', 'M12 5v2', 'M12 17v2'],
    },
    {
        value: 'ethereum', label: 'Ethereum', symbol: 'ETH',
        icon: ['M12 4l5.5 8L12 15 6.5 12z', 'M6.5 13.5L12 20l5.5-6.5'],
    },
    {
        value: 'solana', label: 'Solana', symbol: 'SOL',
        icon: ['M7.5 8.5h9', 'M6.5 12h9', 'M7.5 15.5h9'],
    },
    {
        value: 'xrp', label: 'XRP', symbol: 'XRP',
        icon: ['M7 6l5 5 5-5', 'M7 18l5-5 5 5'],
    },
    {
        value: 'bnb', label: 'BNB', symbol: 'BNB',
        icon: ['M12 4.5l3 3-3 3-3-3z', 'M12 13.5l3 3-3 3-3-3z', 'M7.5 9l3 3-3 3-3-3z', 'M16.5 9l3 3-3 3-3-3z'],
    },
    {
        value: 'dogecoin', label: 'Dogecoin', symbol: 'DOGE',
        icon: ['M9.5 7v10', 'M9.5 7h3a5 5 0 0 1 0 10h-3', 'M7.5 12h5'],
    },
    {
        value: 'cardano', label: 'Cardano', symbol: 'ADA',
        icon: ['M8.5 17.5L12 6.5l3.5 11', 'M10 14h4'],
    },
    {
        value: 'avalanche', label: 'Avalanche', symbol: 'AVAX',
        icon: ['M12 5.5L19 18H5z'],
    },
]

const INVESTOR_TYPE_OPTIONS = [
    {
        value: 'hodler', label: 'HODLer', description: 'In it for the long run',
        icon: ['M12 4l6 2.5v5c0 4-2.6 6.6-6 8-3.4-1.4-6-4-6-8v-5z'],
    },
    {
        value: 'day-trader', label: 'Day Trader', description: 'Following the market daily',
        icon: ['M8 5v14', 'M6.5 8.5h3v6h-3z', 'M16 5v14', 'M14.5 10h3v5h-3z'],
    },
    {
        value: 'nft-collector', label: 'NFT Collector', description: 'Collecting and following drops',
        icon: ['M4.5 5.5h15v13h-15z', 'M4.5 15l4-3.5 3.5 3 3-2.5 4 3.5', 'M9 9.5h.01'],
    },
    {
        value: 'just-exploring', label: 'Just Exploring', description: 'Still learning how it all works',
        icon: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16', 'M14.5 9.5l-1.5 5-5 1.5 1.5-5z'],
    },
]

const CONTENT_TYPE_OPTIONS = [
    {
        value: 'market-news', label: 'Market News',
        icon: ['M4.5 6.5h12v12h-12z', 'M16.5 9.5h3v7a2 2 0 0 1-2 2h-1', 'M7 9.5h7', 'M7 12.5h7', 'M7 15.5h4'],
    },
    {
        value: 'charts', label: 'Charts',
        icon: ['M4.5 19.5h15', 'M7.5 16.5v-5', 'M12 16.5v-9', 'M16.5 16.5v-7'],
    },
    {
        value: 'social', label: 'Social',
        icon: ['M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6', 'M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5', 'M16 6.5a3 3 0 0 1 0 5.8', 'M17 14.6c2 .7 3.5 2.3 3.5 4.4'],
    },
    {
        value: 'fun', label: 'Fun',
        icon: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16', 'M9 10h.01', 'M15 10h.01', 'M8.5 14a4.5 4.5 0 0 0 7 0'],
    },
]

function OptionIcon({ paths, className = '' }) {
    return (
        <svg className={`option-icon ${className}`} viewBox="0 0 24 24" aria-hidden="true">
            {paths.map((path, idx) => <path key={idx} d={path} />)}
        </svg>
    )
}

function CheckIcon() {
    return (
        <svg className="check-icon" viewBox="0 0 24 24" aria-hidden="true">
            <polyline points="5,13 10,18 19,7" />
        </svg>
    )
}

export function Onboarding() {

    const [step, setStep] = useState(1)
    const [preferences, setPreferences] = useState({ assets: [], investorType: '', contentTypes: [] })
    const [errorMsg, setErrorMsg] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const navigate = useNavigate()

    function toggleValue(field, value) {
        setPreferences(prevPreferences => {
            const values = prevPreferences[field]
            const updatedValues = values.includes(value)
                ? values.filter(currValue => currValue !== value)
                : [...values, value]
            return { ...prevPreferences, [field]: updatedValues }
        })
        setErrorMsg('')
    }

    function selectInvestorType(value) {
        setPreferences(prevPreferences => ({ ...prevPreferences, investorType: value }))
        setErrorMsg('')
    }

    function onBack() {
        setErrorMsg('')
        setStep(prevStep => prevStep - 1)
    }

    function onContinue() {
        if (step === 1 && !preferences.assets.length) {
            setErrorMsg('Please select at least one asset')
            return
        }
        if (step === 2 && !preferences.investorType) {
            setErrorMsg('Please select an investor type')
            return
        }

        setErrorMsg('')
        setStep(prevStep => prevStep + 1)
    }

    async function onSubmit() {
        if (!preferences.contentTypes.length) {
            setErrorMsg('Please select at least one content type')
            return
        }
        if (isLoading) return

        setIsLoading(true)
        setErrorMsg('')

        try {
            await userPreferencesService.savePreferences(preferences)
            await userService.completeOnboarding()
            navigate('/')
        } catch (err) {
            console.log('Saving preferences failed:', err)
            setErrorMsg(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="onboarding">
            <div className="onboarding-container">

                <div className="brand">
                    <span className="brand-mark" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                            <polyline points="3,16 9,10 13,13 21,5" />
                        </svg>
                    </span>
                    <span className="brand-name">Crypto Advisor</span>
                </div>

                <header className="onboarding-header">
                    <h1>Personalize your daily briefing</h1>
                    <p>
                        Your answers decide which coins, news, and insights show up on your
                        dashboard every day.
                    </p>
                </header>

                <section className="onboarding-card">

                    <div className="onboarding-progress">
                        <span className="progress-label">Step {step} of 3</span>
                        <div className={`progress-track is-step-${step}`} aria-hidden="true">
                            <div className="progress-bar"></div>
                        </div>
                    </div>

                    <div className="onboarding-body">

                        {step === 1 && (
                            <section className="onboarding-step">
                                <h2>What crypto assets are you interested in?</h2>
                                <p className="step-hint">Select all that apply.</p>

                                <div className="options options-assets">
                                    {ASSET_OPTIONS.map(option => (
                                        <label className="option option-chip" key={option.value}>
                                            <input
                                                className="option-input"
                                                type="checkbox"
                                                checked={preferences.assets.includes(option.value)}
                                                onChange={() => toggleValue('assets', option.value)}
                                            />
                                            <span className="option-box">
                                                <span className="option-head">
                                                    <OptionIcon paths={option.icon} className={`icon-${option.value}`} />
                                                    <span className="option-symbol">{option.symbol}</span>
                                                </span>
                                                <span className="option-label">{option.label}</span>
                                                <span className="option-marker option-marker-multi">
                                                    <CheckIcon />
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </section>
                        )}

                        {step === 2 && (
                            <section className="onboarding-step">
                                <h2>What type of investor are you?</h2>
                                <p className="step-hint">Pick the one that fits you best.</p>

                                <div className="options options-investor">
                                    {INVESTOR_TYPE_OPTIONS.map(option => (
                                        <label className="option option-card" key={option.value}>
                                            <input
                                                className="option-input"
                                                type="radio"
                                                name="investorType"
                                                checked={preferences.investorType === option.value}
                                                onChange={() => selectInvestorType(option.value)}
                                            />
                                            <span className="option-box">
                                                <OptionIcon paths={option.icon} />
                                                <span className="option-text">
                                                    <span className="option-label">{option.label}</span>
                                                    <span className="option-description">{option.description}</span>
                                                </span>
                                                <span className="option-marker option-marker-single"></span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </section>
                        )}

                        {step === 3 && (
                            <section className="onboarding-step">
                                <h2>What kind of content would you like to see?</h2>
                                <p className="step-hint">Select all that apply.</p>

                                <div className="options options-content">
                                    {CONTENT_TYPE_OPTIONS.map(option => (
                                        <label className="option option-card" key={option.value}>
                                            <input
                                                className="option-input"
                                                type="checkbox"
                                                checked={preferences.contentTypes.includes(option.value)}
                                                onChange={() => toggleValue('contentTypes', option.value)}
                                            />
                                            <span className="option-box">
                                                <OptionIcon paths={option.icon} />
                                                <span className="option-text">
                                                    <span className="option-label">{option.label}</span>
                                                </span>
                                                <span className="option-marker option-marker-multi">
                                                    <CheckIcon />
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </section>
                        )}

                        {errorMsg && <p className="error-msg" role="alert">{errorMsg}</p>}

                    </div>

                    <div className="onboarding-actions">
                        {step > 1 && (
                            <button type="button" className="btn-secondary" onClick={onBack} disabled={isLoading}>
                                Back
                            </button>
                        )}

                        {step < 3
                            ? <button type="button" className="btn-primary" onClick={onContinue}>Continue</button>
                            : <button type="button" className="btn-primary" onClick={onSubmit} disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Build my dashboard'}
                            </button>}
                    </div>

                </section>
            </div>
        </main>
    )
}
