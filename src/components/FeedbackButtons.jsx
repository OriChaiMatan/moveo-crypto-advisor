import { useEffect, useState } from 'react'
import { dashboardService } from '../services/dashboard.service'

function ThumbIcon({ isDown = false }) {
    return (
        <svg className="thumb-icon" viewBox="0 0 24 24" aria-hidden="true">
            <g transform={isDown ? 'rotate(180 12 12)' : undefined}>
                <path d="M7 10.5v8.5H4.6A1.6 1.6 0 0 1 3 17.4v-5.3a1.6 1.6 0 0 1 1.6-1.6z" />
                <path d="M7 10.5l4.2-6.6a1.7 1.7 0 0 1 3.1 1v3.6h4.1a1.9 1.9 0 0 1 1.85 2.35l-1.3 5.8A2.2 2.2 0 0 1 16.8 19H7" />
            </g>
        </svg>
    )
}

export function FeedbackButtons({ userId, section, contentId, source, context }) {

    const [vote, setVote] = useState(null)

    useEffect(() => {
        loadVote()

        async function loadVote() {
            if (!userId || !contentId) return

            try {
                const feedback = await dashboardService.getFeedback(userId, section, contentId)
                setVote(feedback?.vote || null)
            } catch (err) {
                console.log('Loading feedback failed:', err.message)
                setVote(null)
            }
        }
    }, [userId, section, contentId])

    async function onVote(nextVote) {
        if (!userId || !contentId) return

        // Clicking the active vote again cancels it
        const isSameVote = vote === nextVote

        try {
            if (isSameVote) {
                await dashboardService.removeFeedback(userId, section, contentId)
                setVote(null)
            } else {
                await dashboardService.saveFeedback({ userId, section, contentId, source, vote: nextVote, context })
                setVote(nextVote)
            }
        } catch (err) {
            console.log('Saving feedback failed:', err.message)
        }
    }

    if (!userId || !contentId) return null

    return (
        <div className="feedback-buttons">
            <span className="feedback-label">Was this useful?</span>

            <div className="feedback-actions">
                <button
                    type="button"
                    className={`feedback-btn ${vote === 'up' ? 'is-active is-up' : ''}`}
                    onClick={() => onVote('up')}
                    aria-pressed={vote === 'up'}
                    aria-label="Yes, this was useful"
                >
                    <ThumbIcon />
                </button>

                <button
                    type="button"
                    className={`feedback-btn ${vote === 'down' ? 'is-active is-down' : ''}`}
                    onClick={() => onVote('down')}
                    aria-pressed={vote === 'down'}
                    aria-label="No, this was not useful"
                >
                    <ThumbIcon isDown />
                </button>
            </div>
        </div>
    )
}
