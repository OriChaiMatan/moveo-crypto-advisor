// Small generic helpers used by more than one component or service.
// Anything specific to a single screen stays with that screen.

export function formatPrice(price) {
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

// Large amounts such as market cap and volume, shortened to $1.23T
export function formatCompactPrice(value) {
    if (typeof value !== 'number') return '—'

    return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 2,
    })
}

export function formatChange(change) {
    if (typeof change !== 'number') return '—'
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
}

// Turns a series of values into SVG points that fill the given viewBox.
// The padding keeps the line off the top and bottom edges, so a peak or a
// trough is never clipped by the stroke width.
export function getChartPoints(values, width, height, padding = 0) {
    if (values.length < 2) return ''

    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    const top = padding
    const bottom = height - padding

    return values
        .map((value, idx) => {
            const x = (idx / (values.length - 1)) * width
            const y = bottom - ((value - min) / range) * (bottom - top)
            return `${x.toFixed(2)},${y.toFixed(2)}`
        })
        .join(' ')
}
