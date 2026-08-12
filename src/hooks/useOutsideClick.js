import { useEffect, useRef } from 'react'

// Closes an open dropdown when the user clicks outside it or presses Escape.
// The listeners are registered only while isOpen is true, and removed as soon as it turns false.
export function useOutsideClick(ref, isOpen, onClose) {

    // The callback is usually written inline, so a new one arrives on every render.
    // Reading it through a ref keeps the effect keyed on isOpen alone, which means
    // the listeners are registered once per opening instead of once per render.
    const onCloseRef = useRef(onClose)
    onCloseRef.current = onClose

    useEffect(() => {
        if (!isOpen) return

        function handleMouseDown(ev) {
            if (ref.current && !ref.current.contains(ev.target)) onCloseRef.current()
        }

        function handleEscapeKeyPress(ev) {
            if (ev.key === 'Escape') onCloseRef.current()
        }

        document.addEventListener('mousedown', handleMouseDown)
        document.addEventListener('keydown', handleEscapeKeyPress)

        return () => {
            document.removeEventListener('mousedown', handleMouseDown)
            document.removeEventListener('keydown', handleEscapeKeyPress)
        }
    }, [ref, isOpen])
}
