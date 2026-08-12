import { CoinPricePreview } from './CoinPricePreview'
import { FeedbackButtons } from './FeedbackButtons'

function CoinSkeleton() {
    return (
        <div className="coin-strip" aria-hidden="true">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(card => (
                <div className="coin-card is-skeleton" key={card}>
                    <div className="skeleton-block is-header"></div>
                    <div className="skeleton-block is-price"></div>
                    <div className="skeleton-block is-footer"></div>
                </div>
            ))}
        </div>
    )
}

export function CoinPricesList({ coins = [], isLoading = false, hasFailed = false, userId = '', context = {} }) {

    return (
        <section className="dashboard-section coin-prices" aria-busy={isLoading}>
            <header className="coin-prices-header">
                <span className="header-accent" aria-hidden="true"></span>
                <div>
                    <h2>Market Overview</h2>
                    <p className="header-subtitle">Your assets first, followed by the wider market</p>
                </div>
            </header>

            {isLoading && <CoinSkeleton />}

            {!isLoading && (hasFailed || !coins.length) && (
                <p className="coin-state">Market prices are temporarily unavailable.</p>
            )}

            {!isLoading && !hasFailed && !!coins.length && (
                <>
                <ul className="coin-strip">
                    {coins.map(coin => (
                        <li key={coin.id}>
                            <CoinPricePreview coin={coin} />
                        </li>
                    ))}
                </ul>

                <FeedbackButtons
                    userId={userId}
                    section="market-overview"
                    contentId={coins.map(coin => coin.id).join(',')}
                    source="coingecko"
                    context={context}
                />
                </>
            )}
        </section>
    )
}
