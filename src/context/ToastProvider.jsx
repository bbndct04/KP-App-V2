import { useCallback, useMemo, useRef, useState } from 'react'
import { MdOutlineCheckCircle, MdOutlineErrorOutline, MdOutlineInfo, MdClose } from 'react-icons/md'
import { ToastContext } from './toastContext'

const STYLES = {
  success: { icon: MdOutlineCheckCircle, color: 'text-success-strong', border: 'border-success-strong/40', role: 'status' },
  error: { icon: MdOutlineErrorOutline, color: 'text-danger-strong', border: 'border-danger-strong/40', role: 'alert' },
  info: { icon: MdOutlineInfo, color: 'text-info-strong', border: 'border-info-strong/40', role: 'status' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (type, message, duration) => {
      const id = ++idRef.current
      setToasts((list) => [...list.slice(-2), { id, type, message }])
      setTimeout(() => dismiss(id), duration ?? (type === 'error' ? 8000 : 5000))
    },
    [dismiss]
  )

  const api = useMemo(
    () => ({
      success: (message, duration) => show('success', message, duration),
      error: (message, duration) => show('error', message, duration),
      info: (message, duration) => show('info', message, duration),
    }),
    [show]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed top-[max(1rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-[70] flex flex-col gap-2.5 w-[calc(100%-2rem)] max-w-[420px] pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const s = STYLES[t.type]
          const Icon = s.icon
          return (
            <div
              key={t.id}
              role={s.role}
              className={`toast-in pointer-events-auto bg-surface border-2 ${s.border} rounded-xl p-4 shadow-token-lg flex items-start gap-3`}
            >
              <Icon className={`text-2xl flex-shrink-0 ${s.color}`} aria-hidden="true" />
              <div className="flex-1 text-ink text-sm font-medium leading-relaxed pt-0.5">{t.message}</div>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss message" className="text-ink-faint hover:text-ink flex-shrink-0">
                <MdClose className="text-xl" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
