import { useEffect } from 'react'

export default function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const items = root.querySelectorAll('.reveal')
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [rootRef])
}
