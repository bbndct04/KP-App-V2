import { useEffect, useState } from 'react'
import { MdOutlineMarkEmailUnread, MdOutlineWarningAmber, MdOutlineCheckCircle } from 'react-icons/md'

const COOLDOWN = 60

function CheckEmailStep({ email, busy, error, uploadWarning, onResend, onConfirmed, onStartOver }) {
  const [wait, setWait] = useState(COOLDOWN)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  async function resend() {
    setNote('')
    const msg = await onResend()
    setNote(msg || 'We sent a new link. Check your inbox, Spam and Promotions folders.')
    setWait(COOLDOWN)
  }

  return (
    <div className="text-center">
      <div className="w-[76px] h-[76px] bg-accent-soft rounded-full flex items-center justify-center mx-auto mb-4">
        <MdOutlineMarkEmailUnread className="text-4xl text-accent" aria-hidden="true" />
      </div>
      <h2 className="text-ink text-2xl font-bold mb-1.5">Check your email</h2>
      <p className="text-ink-soft text-sm leading-relaxed max-w-[380px] mx-auto">
        We sent a confirmation link to
        <span className="block text-ink font-semibold break-all">{email}</span>
      </p>

      <ol className="text-left bg-surface-sunken border border-border rounded-xl p-4 my-5 max-w-[400px] mx-auto flex flex-col gap-2.5 text-sm text-ink-soft">
        {['Open the email from KP App (check Spam or Promotions too).', 'Tap the confirmation link.', 'You will be logged in to the KP App automatically.'].map((t, i) => (
          <li key={t} className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-accent text-accent-ink text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
            {t}
          </li>
        ))}
      </ol>

      {uploadWarning ? (
        <div className="bg-warning-soft border border-warning-strong/25 text-warning-strong text-sm rounded-lg px-4 py-3 mb-4 max-w-[400px] mx-auto text-left flex gap-2">
          <MdOutlineWarningAmber className="text-xl flex-shrink-0" aria-hidden="true" />
          {uploadWarning}
        </div>
      ) : (
        <div className="text-success-strong text-sm font-medium mb-4 flex items-center justify-center gap-1.5">
          <MdOutlineCheckCircle aria-hidden="true" /> Your ID and face photo were received
        </div>
      )}

      {error && (
        <div role="alert" className="bg-danger-soft border border-danger-strong/20 text-danger-strong text-sm rounded-lg px-4 py-2.5 mb-4 max-w-[400px] mx-auto">
          {error}
        </div>
      )}
      {note && !error && <div className="bg-info-soft border border-info-strong/20 text-info-strong text-sm rounded-lg px-4 py-2.5 mb-4 max-w-[400px] mx-auto">{note}</div>}

      <button
        type="button"
        onClick={onConfirmed}
        disabled={busy}
        className="w-full max-w-[320px] bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-ink font-semibold text-sm rounded-xl py-3 shadow-token-md"
      >
        {busy ? 'Checking...' : "I've confirmed my email"}
      </button>
      <p className="text-xs text-ink-faint mt-1.5">Use this if you opened the link on another phone or computer.</p>

      <div className="mt-5 text-sm text-ink-soft">
        Didn't get the email?{' '}
        {wait > 0 ? (
          <span className="text-ink-faint">Resend in {wait}s</span>
        ) : (
          <button type="button" onClick={resend} className="text-accent font-semibold">
            Resend link
          </button>
        )}
      </div>
      <div className="mt-2 text-sm text-ink-soft">
        Wrong email?{' '}
        <button type="button" onClick={onStartOver} className="text-accent font-semibold">
          Change it
        </button>
      </div>
    </div>
  )
}

export default CheckEmailStep
