import { useEffect } from 'react'

const KEY = 'kp-admin-last-active'
const EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart']

function read() {
  try {
    return Number(localStorage.getItem(KEY)) || 0
  } catch {
    return 0
  }
}

function write(t) {
  try {
    localStorage.setItem(KEY, String(t))
  } catch {
    /* storage unavailable */
  }
}

export default function useIdleLogout(enabled, onIdle, minutes = 30) {
  useEffect(() => {
    if (!enabled) return
    const limit = minutes * 60000
    const last = read()
    if (last && Date.now() - last > limit) {
      onIdle()
      return
    }
    write(Date.now())

    let throttle = 0
    const touch = () => {
      const now = Date.now()
      if (now - throttle > 15000) {
        throttle = now
        write(now)
      }
    }
    EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }))
    const timer = setInterval(() => {
      if (Date.now() - read() > limit) onIdle()
    }, 30000)
    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, touch))
      clearInterval(timer)
    }
  }, [enabled, onIdle, minutes])
}

export function clearIdle() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable */
  }
}
