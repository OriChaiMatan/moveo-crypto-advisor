import { useEffect, useRef, useState } from 'react'
import { userService } from '../services/user.service'
import { userPreferencesService } from '../services/user-preferences.service'
import { dashboardService } from '../services/dashboard.service'
import { DashboardHeader } from '../components/DashboardHeader'
import { CoinPricesList } from '../components/CoinPricesList'
import { CoinData } from '../components/CoinData'
import { AIInsight } from '../components/AIInsight'
import { MarketNewsList } from '../components/MarketNewsList'
import { CryptoMeme } from '../components/CryptoMeme'
import { getAsset } from '../data/assets'
import { getInvestorType, getContentType } from '../data/preferences'
import { usePointerParallax } from '../hooks/usePointerParallax'

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
    // Read from storage on every render, so the object is new each time. The effect
    // below depends on this plain id instead, which stays the same between renders.
    const userId = loggedinUser?._id

    const [preferences, setPreferences] = useState(null)
    const [isPreferencesLoading, setIsPreferencesLoading] = useState(true)
    const [coins, setCoins] = useState([])
    const [isCoinsLoading, setIsCoinsLoading] = useState(true)
    const [hasCoinsFailed, setHasCoinsFailed] = useState(false)
    const coinsLayerRef = useRef(null)

    // The floating coins follow the pointer across the hero, through CSS variables only
    const heroParallax = usePointerParallax(coinsLayerRef)

    useEffect(() => {
        loadPreferences()

        async function loadPreferences() {
            if (!userId) return

            try {
                const userPreferences = await userPreferencesService.getPreferences(userId)
                setPreferences(userPreferences)
            } catch (err) {
                console.error('Loading preferences failed:', err.message)
            } finally {
                setIsPreferencesLoading(false)
            }
        }
    }, [userId])

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
                console.error('Loading coin prices failed:', err.message)
                setCoins([])
                setHasCoinsFailed(true)
            } finally {
                setIsCoinsLoading(false)
            }
        }
    }, [isPreferencesLoading])

    // Right after logout there is one render without a user, before the route changes
    if (!loggedinUser) return null

    // The same order drives the header shortcuts and the rendered sections
    const sectionOrder = getSectionOrder(preferences?.contentTypes)
    const headerSections = sectionOrder.map(section => ({ id: section, label: SECTION_LABELS[section] }))

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

            <DashboardHeader userName={loggedinUser.name} sections={headerSections} />

            <main className="dashboard-main">

                <div className="dashboard-stage">
                <div className="dashboard-hero">
                    <section className="dashboard-intro" {...heroParallax}>

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
                                            {getAsset(asset)?.symbol || asset}
                                        </span>
                                    ))}
                                </div>

                                <div className="tag-group">
                                    <span className="tag tag-investor">
                                        {getInvestorType(preferences.investorType)?.label || preferences.investorType}
                                    </span>
                                </div>

                                <div className="tag-group">
                                    {preferences.contentTypes.map(contentType => (
                                        <span className="tag" key={contentType}>
                                            {getContentType(contentType)?.label || contentType}
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
                                hasCoinsFailed={hasCoinsFailed}
                            />
                        )
                    }

                    return <CryptoMeme key={section} id={section} userId={loggedinUser._id} context={feedbackContext} />
                })}

            </main>
        </div>
    )
}
