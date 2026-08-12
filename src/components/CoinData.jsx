import { useEffect, useState } from 'react'
import { dashboardService } from '../services/dashboard.service'
import { FeedbackButtons } from './FeedbackButtons'

// Days from January 1st of the current year until today
function getDaysSinceStartOfYear() {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const days = Math.ceil((now - startOfYear) / (1000 * 60 * 60 * 24))
    return Math.max(days, 1)
}

function formatPrice(price) {
    if (typeof price !== 'number') return '—'

    const digits = price >= 1 ? 2 : 5
    return price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })
}

function formatCompact(value) {
    if (typeof value !== 'number') return '—'

    return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 2,
    })
}

function formatChange(change) {
    if (typeof change !== 'number') return '—'
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
}

// The chart shows the year to date, so its direction comes from the history itself,
// not from the coin's 24 hour change
function getYtdChange(history) {
    if (history.length < 2) return null

    const first = history[0].price
    const last = history[history.length - 1].price
    if (!first) return null

    return ((last - first) / first) * 100
}

// Turns the price history into points inside a 600x200 viewBox
function getChartPoints(history) {
    if (history.length < 2) return ''

    const prices = history.map(point => point.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1

    return prices
        .map((price, idx) => {
            const x = (idx / (prices.length - 1)) * 600
            const y = 190 - ((price - min) / range) * 180
            return `${x.toFixed(2)},${y.toFixed(2)}`
        })
        .join(' ')
}

export function CoinData({ coins = [], isLoading = false, hasFailed = false, userId = '', context = {} }) {

    const [activeCoinId, setActiveCoinId] = useState('')
    const [history, setHistory] = useState([])
    const [isHistoryLoading, setIsHistoryLoading] = useState(true)
    const [hasHistoryFailed, setHasHistoryFailed] = useState(false)

    // Derived from the shared data, so the coin list is never duplicated in state
    const selectedCoins = coins.filter(coin => coin.isSelected)
    const activeCoin = selectedCoins.find(coin => coin.id === activeCoinId) || selectedCoins[0]
    const chartCoinId = activeCoin?.id

    useEffect(() => {
        if (!chartCoinId) return

        const controller = new AbortController()

        loadHistory()

        async function loadHistory() {
            setIsHistoryLoading(true)
            setHasHistoryFailed(false)

            try {
                const days = getDaysSinceStartOfYear()
                const prices = await dashboardService.getCoinHistory(chartCoinId, days, controller.signal)
                setHistory(prices)
            } catch (err) {
                // A newer coin or range replaced this request, so its result is dropped
                if (err.name === 'AbortError') return

                console.log('Loading coin history failed:', err.message)
                setHistory([])
                setHasHistoryFailed(true)
            } finally {
                if (!controller.signal.aborted) setIsHistoryLoading(false)
            }
        }

        return () => controller.abort()
    }, [chartCoinId])

    if (isLoading) {
        return (
            <section className="dashboard-section coin-data" aria-busy="true">
                <CoinDataHeader />
                <div className="coin-data-skeleton" aria-hidden="true">
                    <div className="skeleton-block is-identity"></div>
                    <div className="skeleton-block is-stats"></div>
                    <div className="skeleton-block is-chart"></div>
                </div>
            </section>
        )
    }

    if (hasFailed) {
        return (
            <section className="dashboard-section coin-data">
                <CoinDataHeader />
                <p className="coin-data-state">Coin data is temporarily unavailable.</p>
            </section>
        )
    }

    if (!activeCoin) {
        return (
            <section className="dashboard-section coin-data">
                <CoinDataHeader />
                <p className="coin-data-state">Pick some assets during onboarding to see them here.</p>
            </section>
        )
    }

    const isUp = activeCoin.priceChange24h >= 0
    const points = getChartPoints(history)

    const ytdChange = getYtdChange(history)
    const ytdDirection = ytdChange === null || ytdChange === 0
        ? 'is-flat'
        : (ytdChange > 0 ? 'is-up' : 'is-down')

    return (
        <section className="dashboard-section coin-data">
            <CoinDataHeader />

            {selectedCoins.length > 1 && (
                <div className="coin-tabs" role="tablist" aria-label="Your assets">
                    {selectedCoins.map(coin => (
                        <button
                            type="button"
                            key={coin.id}
                            className={`coin-tab ${coin.id === activeCoin.id ? 'is-active' : ''}`}
                            role="tab"
                            aria-selected={coin.id === activeCoin.id}
                            onClick={() => setActiveCoinId(coin.id)}
                        >
                            {coin.image && <img src={coin.image} alt="" loading="lazy" />}
                            {coin.symbol}
                        </button>
                    ))}
                </div>
            )}

            <div className="coin-panel">
                <div className="panel-top">
                    <div className="coin-identity">
                        {activeCoin.image && (
                            <img className="identity-logo" src={activeCoin.image} alt="" loading="lazy" />
                        )}
                        <div>
                            <h3 className="identity-name">{activeCoin.name}</h3>
                            <span className="identity-symbol">{activeCoin.symbol}</span>
                        </div>
                    </div>

                    <div className="coin-pricing">
                        <p className="pricing-price">{formatPrice(activeCoin.currentPrice)}</p>
                        <span className={`pricing-change ${isUp ? 'is-up' : 'is-down'}`}>
                            {formatChange(activeCoin.priceChange24h)} <span className="change-label">24h</span>
                        </span>
                    </div>
                </div>

                <dl className="coin-stats">
                    <div className="stat">
                        <dt>Market cap</dt>
                        <dd>{formatCompact(activeCoin.marketCap)}</dd>
                    </div>
                    <div className="stat">
                        <dt>24h volume</dt>
                        <dd>{formatCompact(activeCoin.volume24h)}</dd>
                    </div>
                </dl>

                <p className="chart-label">
                    Price history · Year to date
                    {ytdChange !== null && (
                        <span className={`chart-change ${ytdDirection}`}>{formatChange(ytdChange)}</span>
                    )}
                </p>

                <div className="coin-chart-area">
                    {isHistoryLoading && <div className="chart-skeleton" aria-hidden="true"></div>}

                    {!isHistoryLoading && (hasHistoryFailed || !points) && (
                        <p className="chart-state">Chart data is temporarily unavailable.</p>
                    )}

                    {!isHistoryLoading && !hasHistoryFailed && points && (
                        <svg
                            className={`coin-chart ${ytdDirection}`}
                            viewBox="0 0 600 200"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                        >
                            <polygon className="chart-area" points={`${points} 600,200 0,200`} />
                            <polyline className="chart-line" points={points} />
                        </svg>
                    )}
                </div>
            </div>

            <FeedbackButtons
                userId={userId}
                section="coin-prices"
                contentId={selectedCoins.map(coin => coin.id).join(',')}
                source="coingecko"
                context={context}
            />
        </section>
    )
}

function CoinDataHeader() {
    return (
        <header className="coin-data-header">
            <span className="header-accent" aria-hidden="true"></span>
            <div>
                <h2>Your Assets</h2>
                <p className="header-subtitle">A closer look at the coins you follow</p>
            </div>
        </header>
    )
}
