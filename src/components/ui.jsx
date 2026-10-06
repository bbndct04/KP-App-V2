import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { STATUS } from './status'
import {
  MdOutlineInbox,
  MdOutlineWarningAmber,
} from 'react-icons/md'

const BUTTON_VARIANTS = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover shadow-token-sm',
  secondary: 'bg-surface text-ink border border-border hover:bg-surface-hover',
  ghost: 'text-ink-soft hover:text-ink hover:bg-surface-hover',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-token-sm',
}

const BUTTON_SIZES = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export function Button({ variant = 'primary', size = 'md', icon: Icon, className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="text-[1.25em] flex-shrink-0" aria-hidden="true" />}
      {children}
    </button>
  )
}

export function LinkButton({ to, variant = 'primary', size = 'md', icon: Icon, className = '', children, ...props }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-colors ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="text-[1.25em] flex-shrink-0" aria-hidden="true" />}
      {children}
    </Link>
  )
}

const FIELD_BASE =
  'w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 disabled:opacity-60 disabled:cursor-not-allowed'

export function Field({ label, required, hint, error, children }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-ink-soft mb-1.5">
          {label} {required && <span className="text-danger-strong">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <div className="text-xs text-ink-faint mt-1.5">{hint}</div>}
      {error && <div className="text-xs text-danger-strong mt-1.5">{error}</div>}
    </div>
  )
}

export function Input({ className = '', ...props }) {
  return <input className={`${FIELD_BASE} ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${FIELD_BASE} ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`${FIELD_BASE} resize-y ${className}`} {...props} />
}

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`bg-surface border border-border rounded-2xl shadow-token-md ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center flex-shrink-0">
            <Icon className="text-xl" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <div className="text-ink text-base font-semibold truncate">{title}</div>
          {subtitle && <div className="text-ink-faint text-xs mt-0.5">{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
  )
}


export function StatusBadge({ status, size = 'sm' }) {
  const s = STATUS[status] || STATUS.filed
  const Icon = s.icon
  const sizing = size === 'lg' ? 'text-sm px-3.5 py-1.5 gap-1.5' : 'text-xs px-2.5 py-1 gap-1'
  return (
    <span className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${sizing} ${s.className}`}>
      <Icon className="text-[1.15em]" aria-hidden="true" />
      {s.label}
    </span>
  )
}

export function EmptyState({ icon: Icon = MdOutlineInbox, title, message, action }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="w-14 h-14 rounded-2xl bg-surface-sunken text-ink-faint flex items-center justify-center mx-auto mb-4">
        <Icon className="text-3xl" aria-hidden="true" />
      </div>
      <div className="text-ink text-base font-semibold mb-1">{title}</div>
      {message && <div className="text-ink-faint text-sm max-w-[360px] mx-auto">{message}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-surface-sunken ${className}`} />
}

export function SkeletonRows({ rows = 4 }) {
  return (
    <div className="p-5 flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-5" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-surface border border-border rounded-2xl p-6 max-w-[420px] w-full shadow-token-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5 mb-5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              tone === 'danger' ? 'bg-danger-soft text-danger-strong' : 'bg-accent-soft text-accent'
            }`}
          >
            <MdOutlineWarningAmber className="text-2xl" aria-hidden="true" />
          </div>
          <div>
            <div className="text-ink text-lg font-bold mb-1">{title}</div>
            <div className="text-ink-soft text-sm leading-relaxed">{message}</div>
          </div>
        </div>
        <div className="flex gap-2.5 justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
            {loading ? 'Please wait...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
