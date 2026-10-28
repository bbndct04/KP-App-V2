import { useEffect, useRef } from 'react'

export default function AuthBackground({ contained = false }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const set = (x, y) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${x}px`)
        el.style.setProperty('--my', `${y}px`)
      })
    }

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const onMove = (e) => {
        const r = el.getBoundingClientRect()
        set(e.clientX - r.left, e.clientY - r.top)
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      return () => {
        window.removeEventListener('pointermove', onMove)
        cancelAnimationFrame(frame)
      }
    }

    let t = 0
    const id = setInterval(() => {
      t += 0.02
      set(el.clientWidth * (0.5 + 0.3 * Math.sin(t)), el.clientHeight * (0.35 + 0.15 * Math.cos(t * 0.8)))
    }, 50)
    return () => {
      clearInterval(id)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={ref} className={`auth-bg${contained ? ' contained' : ''}`} aria-hidden="true">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="grid" />
      <div className="spotlight" />
      <div className="grain" />
    </div>
  )
}
