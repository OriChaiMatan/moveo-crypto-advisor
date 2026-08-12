import { useState } from 'react'
import { userPreferencesService } from '../services/user-preferences.service'
import { ASSETS } from '../data/assets'
import { INVESTOR_TYPES, CONTENT_TYPES } from '../data/preferences'

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

// Saving the answers finishes onboarding, so the updated user is reported
// upwards and the app moves on to the dashboard
export function Onboarding({ onPreferencesSaved }) {

    const [step, setStep] = useState(1)
    const [preferences, setPreferences] = useState({ assets: [], investorType: '', contentTypes: [] })
    const [errorMsg, setErrorMsg] = useState('')
    const [isLoading, setIsLoading] = useState(false)

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
            const updatedUser = await userPreferencesService.savePreferences(preferences)
            onPreferencesSaved(updatedUser)
        } catch (err) {
            console.error('Saving preferences failed:', err.message)
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
                                    {ASSETS.map(option => (
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
                                    {INVESTOR_TYPES.map(option => (
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
                                    {CONTENT_TYPES.map(option => (
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
