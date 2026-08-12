import { useRef } from 'react'

// Writes the pointer position onto the target element as --pointer-x and --pointer-y,
// each between -0.5 and 0.5. The values go straight into the style, so moving the
// pointer never re-renders. CSS decides how far anything actually moves, and ignores
// the values on mobile and with reduced motion.
//
// Spread the returned handlers onto the element the pointer moves over:
//   const parallax = usePointerParallax(sparkRef)
//   <section {...parallax}>
export function usePointerParallax(targetRef) {

    // Cached when the pointer enters, so a move never reads the layout
    const boundsRef = useRef(null)

    function onMouseEnter(ev) {
        boundsRef.current = ev.currentTarget.getBoundingClientRect()
    }

    function onMouseMove(ev) {
        const bounds = boundsRef.current
        if (!bounds || !targetRef.current) return

        const x = (ev.clientX - bounds.left) / bounds.width - 0.5
        const y = (ev.clientY - bounds.top) / bounds.height - 0.5

        targetRef.current.style.setProperty('--pointer-x', x.toFixed(3))
        targetRef.current.style.setProperty('--pointer-y', y.toFixed(3))
    }

    function onMouseLeave() {
        boundsRef.current = null
        if (!targetRef.current) return

        targetRef.current.style.setProperty('--pointer-x', '0')
        targetRef.current.style.setProperty('--pointer-y', '0')
    }

    return { onMouseEnter, onMouseMove, onMouseLeave }
}
