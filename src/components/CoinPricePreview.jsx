import { formatPrice, formatChange, getChartPoints } from '../util/util'

export function CoinPricePreview({ coin }) {

    const { symbol, name, image, currentPrice, priceChange24h, sparkline, isSelected } = coin
    const isUp = priceChange24h >= 0
    // Matches the 100x36 viewBox on the sparkline below
    const points = getChartPoints(sparkline, 100, 36, 3)

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
