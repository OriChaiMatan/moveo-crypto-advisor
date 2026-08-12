import { useEffect, useRef, useState } from 'react'
import { dashboardService } from '../services/dashboard.service'
import { FeedbackButtons } from './FeedbackButtons'

export function AIInsight({ coins = [], investorType = '', contentTypes = [], isCoinsLoading = false, userId = '', context = {}, id }) {

    const [insight, setInsight] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasFailed, setHasFailed] = useState(false)
    const sparkRef = useRef(null)
    const boundsRef = useRef(null) // cached on enter, so mousemove does no layout reads

    // Only the user's own assets are sent to the model
    const selectedCoins = coins.filter(coin => coin.isSelected)
    const symbols = selectedCoins.map(coin => coin.symbol)

    // Plain strings keep the effect from running on every render
    const symbolsKey = symbols.join(',')
    const contentTypesKey = contentTypes.join(',')

    useEffect(() => {
        if (isCoinsLoading || !selectedCoins.length) return

        loadInsight()

        async function loadInsight() {
            setIsLoading(true)
            setHasFailed(false)

            try {
                const dailyInsight = await dashboardService.getInsight(selectedCoins, investorType, contentTypes)
                setInsight(dailyInsight)
            } catch (err) {
                console.log('Loading AI insight failed:', err.message)
                setInsight(null)
                setHasFailed(true)
            } finally {
                setIsLoading(false)
            }
        }
    }, [symbolsKey, investorType, contentTypesKey, isCoinsLoading])

    const isBusy = isCoinsLoading || isLoading

    // Pointer position is written straight to CSS variables, so moving the mouse never re-renders.
    // CSS decides how far each spark moves, and ignores the values on mobile and with reduced motion.
    function onPointerEnter(ev) {
        boundsRef.current = ev.currentTarget.getBoundingClientRect()
    }

    function onPointerMove(ev) {
        const bounds = boundsRef.current
        if (!bounds || !sparkRef.current) return

        const x = (ev.clientX - bounds.left) / bounds.width - 0.5
        const y = (ev.clientY - bounds.top) / bounds.height - 0.5

        sparkRef.current.style.setProperty('--pointer-x', x.toFixed(3))
        sparkRef.current.style.setProperty('--pointer-y', y.toFixed(3))
    }

    function onPointerLeave() {
        boundsRef.current = null
        if (!sparkRef.current) return

        sparkRef.current.style.setProperty('--pointer-x', '0')
        sparkRef.current.style.setProperty('--pointer-y', '0')
    }

    return (
        <section
            className="dashboard-section ai-insight"
            id={id}
            aria-busy={isBusy}
            onMouseEnter={onPointerEnter}
            onMouseMove={onPointerMove}
            onMouseLeave={onPointerLeave}
        >
            <header className="ai-insight-header">
                <div className="header-identity">
                    <span className="section-icon-wrap" aria-hidden="true">
                    <span className="header-spark section-icon" ref={sparkRef}>
                        <svg viewBox="0 0 32 32" focusable="false">
                            <path
                                className="spark-main"
                                d="M14 5l2.6 7 7 2.6-7 2.6L14 24.2l-2.6-7-7-2.6 7-2.6z"
                            />
                            <path
                                className="spark-sub"
                                d="M24.5 19.5l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z"
                            />
                            <path
                                className="spark-sub is-small"
                                d="M24 6.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"
                            />
                        </svg>
                    </span>
                    </span>

                    <div className="header-text">
                        <h2>AI Insight of the Day</h2>
                        <p className="header-subtitle">Written for your assets and how you invest</p>
                    </div>
                </div>

                <p className="header-note">
                    AI generated
                    <span className="note-dot" aria-hidden="true"></span>
                    Updated daily
                </p>
            </header>

            {isBusy && (
                <div className="insight-body" aria-hidden="true">
                    <div className="skeleton-block is-eyebrow"></div>
                    <div className="skeleton-block is-title"></div>
                    <div className="skeleton-block is-text"></div>
                    <div className="skeleton-block is-text is-short"></div>
                </div>
            )}

            {!isBusy && !selectedCoins.length && (
                <p className="insight-state">Pick some assets during onboarding to get your daily insight.</p>
            )}

            {!isBusy && !!selectedCoins.length && hasFailed && (
                <p className="insight-state">Today&apos;s insight is temporarily unavailable.</p>
            )}

            {!isBusy && !hasFailed && insight && (
                <>
                    <div className="insight-body">
                        <p className="insight-eyebrow">Personalized take</p>
                        <h3 className="insight-title">{insight.title}</h3>
                        <p className="insight-text">{insight.text}</p>
                    </div>

                    <footer className="insight-footer">
                        <span className="footer-dot" aria-hidden="true"></span>
                        Based on {symbols.join(' · ')}
                    </footer>

                    <FeedbackButtons
                        userId={userId}
                        section="ai-insight"
                        contentId={insight.id}
                        source={insight.source}
                        context={context}
                    />
                </>
            )}
        </section>
    )
}
