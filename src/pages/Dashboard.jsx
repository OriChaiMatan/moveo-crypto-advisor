import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../services/user.service'
import { userPreferencesService } from '../services/user-preferences.service'
import { dashboardService } from '../services/dashboard.service'
import { CoinPricesList } from '../components/CoinPricesList'
import { CoinData } from '../components/CoinData'
import { AIInsight } from '../components/AIInsight'
import { MarketNewsList } from '../components/MarketNewsList'
import { CryptoMeme } from '../components/CryptoMeme'

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

// One place defining the dashboard sections, their order and their shortcut labels
const SECTION_BY_CONTENT_TYPE = {
    'social': 'ai-insight',
    'market-news': 'market-news',
    'fun': 'crypto-meme',
}

const DEFAULT_SECTION_ORDER = ['ai-insight', 'market-news', 'crypto-meme']

const SECTION_LABELS = {
    'ai-insight': 'AI',
    'market-news': 'News',
    'crypto-meme': 'Meme',
}

// The first matching preference promotes one section to the top.
// The others keep the default order behind it.
function getSectionOrder(contentTypes = []) {
    const promoted = contentTypes
        .map(contentType => SECTION_BY_CONTENT_TYPE[contentType])
        .find(Boolean)

    if (!promoted) return DEFAULT_SECTION_ORDER

    return [promoted, ...DEFAULT_SECTION_ORDER.filter(section => section !== promoted)]
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
    const [isNavOpen, setIsNavOpen] = useState(false)
    const [preferences, setPreferences] = useState(null)
    const [isPreferencesLoading, setIsPreferencesLoading] = useState(true)
    const [coins, setCoins] = useState([])
    const [isCoinsLoading, setIsCoinsLoading] = useState(true)
    const [hasCoinsFailed, setHasCoinsFailed] = useState(false)
    const accountRef = useRef(null)
    const navRef = useRef(null)
    const coinsLayerRef = useRef(null)
    const heroBoundsRef = useRef(null) // cached on enter, so mousemove does no layout reads

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

    // Coin data is loaded once here, so several sections can share it
    useEffect(() => {
        if (isPreferencesLoading) return

        loadCoins()

        async function loadCoins() {
            setIsCoinsLoading(true)
            setHasCoinsFailed(false)

            try {
                const coinData = await dashboardService.getCoinData(preferences?.assets || [])
                setCoins(coinData)
            } catch (err) {
                console.log('Loading coin prices failed:', err.message)
                setCoins([])
                setHasCoinsFailed(true)
            } finally {
                setIsCoinsLoading(false)
            }
        }
    }, [isPreferencesLoading])

    useEffect(() => {
        if (!isNavOpen) return

        function handleClickOutside(ev) {
            if (navRef.current && !navRef.current.contains(ev.target)) setIsNavOpen(false)
        }

        function handleEscapeKeyPress(ev) {
            if (ev.key === 'Escape') setIsNavOpen(false)
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscapeKeyPress)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscapeKeyPress)
        }
    }, [isNavOpen])

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

    // Pointer position goes straight into CSS variables, so the floating coins never re-render.
    // CSS decides how far each depth layer moves, and ignores it on mobile and with reduced motion.
    function onHeroPointerEnter(ev) {
        heroBoundsRef.current = ev.currentTarget.getBoundingClientRect()
    }

    function onHeroPointerMove(ev) {
        const bounds = heroBoundsRef.current
        if (!bounds || !coinsLayerRef.current) return

        const x = (ev.clientX - bounds.left) / bounds.width - 0.5
        const y = (ev.clientY - bounds.top) / bounds.height - 0.5

        coinsLayerRef.current.style.setProperty('--pointer-x', x.toFixed(3))
        coinsLayerRef.current.style.setProperty('--pointer-y', y.toFixed(3))
    }

    function onHeroPointerLeave() {
        heroBoundsRef.current = null
        if (!coinsLayerRef.current) return

        coinsLayerRef.current.style.setProperty('--pointer-x', '0')
        coinsLayerRef.current.style.setProperty('--pointer-y', '0')
    }

    async function onLogout() {
        setIsMenuOpen(false)
        await userService.logout()
        navigate('/login')
    }

    // Right after logout there is one render without a user, before the route changes
    if (!loggedinUser) return null

    // The same order drives the header shortcuts and the rendered sections
    const sectionOrder = getSectionOrder(preferences?.contentTypes)

    // Decorative only: the coin images already in the shared data, selected assets first
    const floatingCoins = [
        ...coins.filter(coin => coin.isSelected),
        ...coins.filter(coin => !coin.isSelected),
    ].filter(coin => coin.image).slice(0, 8)

    // Passed to every section so their feedback records share one user and one snapshot
    const feedbackContext = {
        assets: preferences?.assets || [],
        investorType: preferences?.investorType || '',
        contentTypes: preferences?.contentTypes || [],
    }

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

                    <nav className="header-nav" aria-label="Dashboard sections">
                        {sectionOrder.map(section => (
                            <a href={`#${section}`} key={section}>{SECTION_LABELS[section]}</a>
                        ))}
                    </nav>

                    <div className="header-actions">
                    <div className="header-nav-mobile" ref={navRef}>
                        <button
                            type="button"
                            className="nav-toggle"
                            onClick={() => setIsNavOpen(prevIsOpen => !prevIsOpen)}
                            aria-haspopup="menu"
                            aria-expanded={isNavOpen}
                            aria-label="Dashboard sections"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M4 7h16" />
                                <path d="M4 12h16" />
                                <path d="M4 17h16" />
                            </svg>
                        </button>

                        {isNavOpen && (
                            <div className="nav-menu" role="menu">
                                {sectionOrder.map(section => (
                                    <a
                                        href={`#${section}`}
                                        key={section}
                                        role="menuitem"
                                        onClick={() => setIsNavOpen(false)}
                                    >
                                        {SECTION_LABELS[section]}
                                    </a>
                                ))}
                            </div>
                        )}
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
                </div>
            </header>

            <main className="dashboard-main">

                <div className="dashboard-stage">
                <div className="dashboard-hero">
                    <section
                        className="dashboard-intro"
                        onMouseEnter={onHeroPointerEnter}
                        onMouseMove={onHeroPointerMove}
                        onMouseLeave={onHeroPointerLeave}
                    >

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

                        {/* Decorative only: fills the empty area under the intro text */}
                        <div className="intro-coins" ref={coinsLayerRef} aria-hidden="true">
                            {/* Faint depth field sitting behind the coins */}
                            <div className="intro-points">
                                {Array.from({ length: 14 }, (_, idx) => (
                                    <span className="intro-point" key={idx}></span>
                                ))}
                            </div>

                            {floatingCoins.map((coin, idx) => (
                                <span className={`coin-slot is-${idx + 1}`} key={coin.id}>
                                    <span className="coin-float">
                                        <img src={coin.image} alt="" loading="lazy" />
                                    </span>
                                </span>
                            ))}
                        </div>
                    </section>

                    <CoinData
                        userId={loggedinUser._id}
                        context={feedbackContext}
                        coins={coins}
                        isLoading={isCoinsLoading}
                        hasFailed={hasCoinsFailed}
                    />
                </div>

                <CoinPricesList
                    userId={loggedinUser._id}
                    context={feedbackContext}
                    coins={coins}
                    isLoading={isCoinsLoading}
                    hasFailed={hasCoinsFailed}
                />
                </div>

                {sectionOrder.map(section => {
                    if (section === 'market-news') {
                        return (
                            <MarketNewsList
                                key={section}
                                id={section}
                                userId={loggedinUser._id}
                                context={feedbackContext}
                                assets={preferences?.assets || []}
                                investorType={preferences?.investorType || ''}
                                isPreferencesLoading={isPreferencesLoading}
                            />
                        )
                    }

                    if (section === 'ai-insight') {
                        return (
                            <AIInsight
                                key={section}
                                id={section}
                                userId={loggedinUser._id}
                                context={feedbackContext}
                                coins={coins}
                                investorType={preferences?.investorType || ''}
                                contentTypes={preferences?.contentTypes || []}
                                isCoinsLoading={isCoinsLoading}
                            />
                        )
                    }

                    return <CryptoMeme key={section} id={section} userId={loggedinUser._id} context={feedbackContext} />
                })}

            </main>
        </div>
    )
}
