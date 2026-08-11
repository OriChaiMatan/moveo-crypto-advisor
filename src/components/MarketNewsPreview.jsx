import { useState } from 'react'

function getRelativeTime(publishedAt) {
    if (!publishedAt) return ''

    const minutes = Math.round((Date.now() - new Date(publishedAt).getTime()) / 60000)
    if (Number.isNaN(minutes) || minutes < 0) return ''

    if (minutes < 60) return `${Math.max(minutes, 1)}m ago`

    const hours = Math.round(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    return `${Math.round(hours / 24)}d ago`
}

// Branded market graphic used whenever there is no usable image
function FallbackMedia({ ticker }) {
    return (
        <span className="news-media-fallback" aria-hidden="true">
            <svg className="fallback-chart" viewBox="0 0 240 140" preserveAspectRatio="none">
                <g className="chart-candles">
                    <rect x="24" y="74" width="7" height="26" />
                    <rect x="52" y="62" width="7" height="20" />
                    <rect x="80" y="80" width="7" height="24" />
                    <rect x="108" y="54" width="7" height="30" />
                    <rect x="136" y="66" width="7" height="18" />
                    <rect x="164" y="44" width="7" height="26" />
                    <rect x="192" y="58" width="7" height="22" />
                </g>
                <polyline className="chart-line is-secondary" points="0,104 40,96 80,100 120,84 160,90 200,74 240,80" />
                <polyline className="chart-line" points="0,92 40,80 80,86 120,64 160,72 200,50 240,58" />
            </svg>

            <span className="fallback-label">
                {ticker && <span className="fallback-ticker">{ticker}</span>}
                <span className="fallback-caption">Market update</span>
            </span>
        </span>
    )
}

export function MarketNewsPreview({ article, isFeatured = false }) {

    const [hasImageFailed, setHasImageFailed] = useState(false)

    const { title, description, source, url, image, currencies = [] } = article
    const publishedTime = getRelativeTime(article.publishedAt)
    const showImage = image && !hasImageFailed

    const content = (
        <>
            <div className={`news-media ${showImage ? 'has-image' : ''}`}>
                {showImage
                    ? <img
                        className="news-image"
                        src={image}
                        alt=""
                        loading="lazy"
                        onError={() => setHasImageFailed(true)}
                    />
                    : <FallbackMedia ticker={currencies[0]} />}
            </div>

            <div className="news-content">
                <div className="news-labels">
                    {isFeatured && <span className="news-eyebrow">Top story</span>}
                    {currencies.map(code => (
                        <span className="news-tag" key={code}>{code}</span>
                    ))}
                </div>

                <h3 className="news-title">{title}</h3>

                {description && <p className="news-description">{description}</p>}

                <p className="news-meta">
                    {source && <span className="news-source">{source}</span>}
                    {source && publishedTime && <span className="meta-dot">·</span>}
                    {publishedTime && <span className="news-time">{publishedTime}</span>}
                </p>
            </div>

            {url && (
                <span className="news-arrow-area" aria-hidden="true">
                    <svg className="news-arrow" viewBox="0 0 24 24">
                        <path d="M8 16L16 8" />
                        <path d="M9.5 8H16v6.5" />
                    </svg>
                </span>
            )}
        </>
    )

    const className = `news-body ${isFeatured ? 'is-featured' : 'is-row'}`

    // Fallback articles have no url, so they stay non-clickable
    if (!url) return <div className={className}>{content}</div>

    return (
        <a className={`${className} news-link`} href={url} target="_blank" rel="noreferrer">
            {content}
        </a>
    )
}
