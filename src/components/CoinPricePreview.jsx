function formatPrice(price) {
    if (typeof price !== 'number') return '—'

    // Small prices such as DOGE need more decimals than BTC
    const digits = price >= 1 ? 2 : 5
    return price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })
}

function formatChange(change) {
    if (typeof change !== 'number') return '—'
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
}

// Turns the price history into points inside a 100x36 viewBox
function getSparklinePoints(prices) {
    if (prices.length < 2) return ''

    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1

    return prices
        .map((price, idx) => {
            const x = (idx / (prices.length - 1)) * 100
            const y = 33 - ((price - min) / range) * 30
            return `${x.toFixed(2)},${y.toFixed(2)}`
        })
        .join(' ')
}

export function CoinPricePreview({ coin }) {

    const { symbol, name, image, currentPrice, priceChange24h, sparkline, isSelected } = coin
    const isUp = priceChange24h >= 0
    const points = getSparklinePoints(sparkline)

    return (
        <article className={`coin-card ${isSelected ? 'is-selected' : ''}`}>
            <div className="coin-top">
                <header className="coin-header">
                    {image && <img className="coin-logo" src={image} alt="" loading="lazy" />}
                    <span className="coin-symbol">{symbol}</span>
                    {isSelected && (
                        <svg className="coin-owned" viewBox="0 0 24 24" role="img">
                            <title>Your asset</title>
                            <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
                        </svg>
                    )}
                </header>

                <span className="coin-name">{name}</span>

                <p className="coin-price">{formatPrice(currentPrice)}</p>

                <span className={`coin-change ${isUp ? 'is-up' : 'is-down'}`}>
                    {formatChange(priceChange24h)}
                </span>
            </div>

            {points && (
                <div className="coin-chart">
                    <svg
                        className={`coin-sparkline ${isUp ? 'is-up' : 'is-down'}`}
                        viewBox="0 0 100 36"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        <polygon className="sparkline-area" points={`${points} 100,36 0,36`} />
                        <polyline className="sparkline-line" points={points} />
                    </svg>
                </div>
            )}
        </article>
    )
}
