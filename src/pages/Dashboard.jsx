import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../services/user.service'
import { userPreferencesService } from '../services/user-preferences.service'
import { MarketNewsList } from '../components/MarketNewsList'

// Readable labels for the values saved during onboarding
const ASSET_LABELS = {
    bitcoin: 'BTC',
    ethereum: 'ETH',
    solana: 'SOL',
    xrp: 'XRP',
    bnb: 'BNB',
    dogecoin: 'DOGE',
    cardano: 'ADA',
    avalanche: 'AVAX',
}

const INVESTOR_TYPE_LABELS = {
    'hodler': 'HODLer',
    'day-trader': 'Day Trader',
    'nft-collector': 'NFT Collector',
    'just-exploring': 'Just Exploring',
}

const CONTENT_TYPE_LABELS = {
    'market-news': 'Market News',
    'charts': 'Charts',
    'social': 'Social',
    'fun': 'Fun',
}

function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
}

export function Dashboard() {

    const loggedinUser = userService.getLoggedinUser()

    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [preferences, setPreferences] = useState(null)
    const [isPreferencesLoading, setIsPreferencesLoading] = useState(true)
    const accountRef = useRef(null)

    const navigate = useNavigate()

    useEffect(() => {
        loadPreferences()

        async function loadPreferences() {
            if (!loggedinUser) return

            try {
                const userPreferences = await userPreferencesService.getPreferences(loggedinUser._id)
                setPreferences(userPreferences)
            } catch (err) {
                console.log('Loading preferences failed:', err)
            } finally {
                setIsPreferencesLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        if (!isMenuOpen) return

        function handleClickOutside(ev) {
            if (accountRef.current && !accountRef.current.contains(ev.target)) setIsMenuOpen(false)
        }

        function handleEscapeKeyPress(ev) {
            if (ev.key === 'Escape') setIsMenuOpen(false)
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscapeKeyPress)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscapeKeyPress)
        }
    }, [isMenuOpen])

    async function onLogout() {
        setIsMenuOpen(false)
        await userService.logout()
        navigate('/login')
    }

    // Right after logout there is one render without a user, before the route changes
    if (!loggedinUser) return null

    return (
        <div className="dashboard">

            <header className="dashboard-header">
                <div className="dashboard-header-inner">
                    <div className="brand">
                        <span className="brand-mark" aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                                <polyline points="3,16 9,10 13,13 21,5" />
                            </svg>
                        </span>
                        <span className="brand-name">Crypto Advisor</span>
                    </div>

                    <div className="header-account" ref={accountRef}>
                        <button
                            type="button"
                            className="account-trigger"
                            onClick={() => setIsMenuOpen(prevIsOpen => !prevIsOpen)}
                            aria-haspopup="menu"
                            aria-expanded={isMenuOpen}
                        >
                            <span className="account-avatar" aria-hidden="true">
                                {loggedinUser.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="account-name">{loggedinUser.name}</span>
                            <svg className="account-chevron" viewBox="0 0 24 24" aria-hidden="true">
                                <polyline points="6,9 12,15 18,9" />
                            </svg>
                        </button>

                        {isMenuOpen && (
                            <div className="account-menu" role="menu">
                                <button type="button" className="menu-item" role="menuitem">Profile</button>
                                <button type="button" className="menu-item" role="menuitem">Settings</button>
                                <div className="menu-separator" role="separator"></div>
                                <button
                                    type="button"
                                    className="menu-item menu-item-logout"
                                    role="menuitem"
                                    onClick={onLogout}
                                >
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="dashboard-main">

                <section className="dashboard-intro">
                    <p className="intro-greeting">{getGreeting()}, {loggedinUser.name.split(' ')[0]}</p>
                    <h1>Your market, personalized for you.</h1>
                    <p className="intro-text">
                        Prices, news and AI insights based on the assets and interests you selected.
                    </p>

                    {preferences && (
                        <div className="intro-tags">
                            <div className="tag-group">
                                {preferences.assets.map(asset => (
                                    <span className="tag tag-asset" key={asset}>
                                        {ASSET_LABELS[asset] || asset}
                                    </span>
                                ))}
                            </div>

                            <div className="tag-group">
                                <span className="tag tag-investor">
                                    {INVESTOR_TYPE_LABELS[preferences.investorType] || preferences.investorType}
                                </span>
                            </div>

                            <div className="tag-group">
                                {preferences.contentTypes.map(contentType => (
                                    <span className="tag" key={contentType}>
                                        {CONTENT_TYPE_LABELS[contentType] || contentType}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                <MarketNewsList
                    assets={preferences?.assets || []}
                    investorType={preferences?.investorType || ''}
                    isPreferencesLoading={isPreferencesLoading}
                />

            </main>
        </div>
    )
}
