import { useEffect, useState } from 'react'
import { dashboardService } from '../services/dashboard.service'
import { FeedbackButtons } from './FeedbackButtons'

export function CryptoMeme({ userId = '', context = {} }) {

    const [meme, setMeme] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasImageFailed, setHasImageFailed] = useState(false)

    useEffect(() => {
        loadMeme()

        async function loadMeme() {
            setIsLoading(true)
            setHasImageFailed(false)

            try {
                const dailyMeme = await dashboardService.getMeme()
                setMeme(dailyMeme)
            } catch (err) {
                console.log('Loading meme failed:', err.message)
                setMeme(null)
            } finally {
                setIsLoading(false)
            }
        }
    }, [])

    const hasMeme = !!meme && !hasImageFailed

    // Only memes that came from the API carry a source
    const isFromReddit = hasMeme && !!meme.subreddit && !!meme.postUrl

    return (
        <section className="dashboard-section crypto-meme" aria-busy={isLoading}>
            <header className="crypto-meme-header">
                <span className="header-accent" aria-hidden="true"></span>

                <div className="header-text">
                    <h2>Fun Crypto Meme</h2>
                    <p className="header-subtitle">Because charts aren&apos;t everything</p>
                </div>

                {isFromReddit && <span className="header-badge">Fresh from Reddit</span>}
            </header>

            {isLoading && (
                <div className="meme-layout" aria-hidden="true">
                    <div className="skeleton-block is-image"></div>
                    <div className="meme-content">
                        <div className="skeleton-block is-eyebrow"></div>
                        <div className="skeleton-block is-title"></div>
                        <div className="skeleton-block is-title is-short"></div>
                        <div className="skeleton-block is-source"></div>
                    </div>
                </div>
            )}

            {!isLoading && !hasMeme && (
                <p className="meme-state">No meme to show right now.</p>
            )}

            {!isLoading && hasMeme && (
                <div className="meme-layout">
                    <figure className="meme-frame">
                        <img
                            className="meme-image"
                            src={meme.imageUrl}
                            alt={meme.title || 'Crypto meme'}
                            loading="lazy"
                            onError={() => setHasImageFailed(true)}
                        />
                    </figure>

                    <div className="meme-content">
                        <p className="meme-eyebrow">
                            <svg className="eyebrow-smile" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M8.5 14a4.5 4.5 0 0 0 7 0" />
                                <path d="M9 9.5h.01" />
                                <path d="M15 9.5h.01" />
                            </svg>
                            Today&apos;s mood
                        </p>

                        <p className="meme-title">{meme.title}</p>

                        {isFromReddit && (
                            <div className="meme-source">
                                <span className="source-sub">r/{meme.subreddit}</span>
                                <a
                                    className="source-link"
                                    href={meme.postUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    View original <span aria-hidden="true">→</span>
                                </a>
                            </div>
                        )}

                        <FeedbackButtons
                            userId={userId}
                            section="crypto-meme"
                            contentId={meme.id}
                            source={isFromReddit ? 'meme-api' : 'local-fallback'}
                            context={context}
                        />
                    </div>
                </div>
            )}
        </section>
    )
}
