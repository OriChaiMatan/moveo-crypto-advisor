import { useEffect, useState } from 'react'
import { dashboardService } from '../services/dashboard.service'
import { MarketNewsPreview } from './MarketNewsPreview'

function NewsSkeleton() {
    return (
        <div className="news-skeleton" aria-hidden="true">
            <div className="skeleton-item is-featured">
                <div className="skeleton-media"></div>
                <div className="skeleton-lines">
                    <span className="skeleton-line is-tag"></span>
                    <span className="skeleton-line is-headline"></span>
                    <span className="skeleton-line is-headline is-short"></span>
                    <span className="skeleton-line is-text"></span>
                    <span className="skeleton-line is-meta"></span>
                </div>
            </div>

            {[1, 2, 3].map(row => (
                <div className="skeleton-item is-row" key={row}>
                    <div className="skeleton-media"></div>
                    <div className="skeleton-lines">
                        <span className="skeleton-line is-tag"></span>
                        <span className="skeleton-line is-headline"></span>
                        <span className="skeleton-line is-meta"></span>
                    </div>
                </div>
            ))}
        </div>
    )
}

export function MarketNewsList({ assets = [], investorType = '', isPreferencesLoading = false }) {

    const [news, setNews] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // A plain string keeps the effect from running on every render
    const assetsKey = assets.join(',')

    useEffect(() => {
        // Waiting for the real assets, so no unpersonalized request is made
        if (isPreferencesLoading) return

        loadNews()

        async function loadNews() {
            setIsLoading(true)

            try {
                const { items } = await dashboardService.getNews(assets, investorType)
                setNews(items)
            } catch (err) {
                console.log('Loading news failed:', err)
                setNews([])
            } finally {
                setIsLoading(false)
            }
        }
    }, [assetsKey, investorType, isPreferencesLoading])

    const isBusy = isPreferencesLoading || isLoading

    return (
        <section className="dashboard-section market-news" aria-busy={isBusy}>
            <header className="market-news-header">
                <span className="header-accent" aria-hidden="true"></span>

                <div className="header-text">
                    <div className="header-top">
                        <h2>Market News</h2>
                        <span className="header-badge">
                            <span className="badge-dot" aria-hidden="true"></span>
                            <span className="badge-label is-full">Personalized feed</span>
                            <span className="badge-label is-short">Personalized</span>
                        </span>
                    </div>
                    <p className="header-subtitle">Latest stories based on your interests</p>
                </div>
            </header>

            {isBusy && <NewsSkeleton />}

            {!isBusy && !news.length && <p className="news-state">No news to show right now.</p>}

            {!isBusy && !!news.length && (
                <ul className="market-news-list">
                    {news.map((article, idx) => (
                        <li className={idx === 0 ? 'news-item is-featured' : 'news-item'} key={article.id}>
                            <MarketNewsPreview article={article} isFeatured={idx === 0} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
