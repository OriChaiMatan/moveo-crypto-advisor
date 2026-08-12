import { FALLBACK_MEMES } from '../../data/memes.js'
import { logger } from '../../services/logger.service.js'

const MEME_API_URL = 'https://meme-api.com/gimme/cryptocurrencymemes'
const MEME_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp']

// The meme API, and our own memes for when it cannot be used
export const memeService = {
    getMeme,
}

// A meme is never required content, so any problem is answered with one of ours
async function getMeme() {
    try {
        const res = await fetch(MEME_API_URL)
        if (!res.ok) throw new Error(`Meme request failed with status ${res.status}`)

        const data = await res.json()
        const meme = _normalizeMeme(data)
        if (!meme) throw new Error('Meme response was not usable')

        return meme
    } catch (err) {
        logger.warn('Using a fallback meme:', err.message)
        return _getFallbackMeme()
    }
}

// Returns null for anything we should not show, so the caller falls back
function _normalizeMeme(post) {
    if (!post?.url || post.nsfw || post.spoiler) return null
    if (!_isImageUrl(post.url)) return null

    return {
        id: post.postLink || post.url,
        title: post.title || '',
        imageUrl: post.url,
        postUrl: post.postLink || '',
        subreddit: post.subreddit || '',
    }
}

function _isImageUrl(url) {
    const path = url.split('?')[0].toLowerCase()
    return MEME_IMAGE_EXTENSIONS.some(extension => path.endsWith(extension))
}

function _getFallbackMeme() {
    return FALLBACK_MEMES[Math.floor(Math.random() * FALLBACK_MEMES.length)]
}
