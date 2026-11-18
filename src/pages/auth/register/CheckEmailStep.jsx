import { useEffect, useRef, useState } from 'react'
import { MdOutlineMarkEmailUnread, MdOutlineWarningAmber, MdOutlineCheckCircle } from 'react-icons/md'
import { useT } from '../../../i18n/LanguageContext'

const COOLDOWN = 60

function CheckEmailStep({ email, busy, error, uploadWarning, onResend, onVerify, onStartOver }) {
  const { t } = useT()
  const [code, setCode] = useState('')
  const [wait, setWait] = useState(COOLDOWN)
  const [note, setNote] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  async function resend() {
    setNote('')
    setCode('')
    const msg = await onResend()
    setNote(msg || t('We sent a new code. Check your inbox, Spam and Promotions folders.'))
    setWait(COOLDOWN)
    inputRef.current?.focus()
  }

  function submit(e) {
    e.preventDefault()
    if (code.length >= 6) onVerify(code)
  }

  return (
    <form onSubmit={submit} className="text-center">
      <div className="w-[76px] h-[76px] bg-accent-soft rounded-full flex items-center justify-center mx-auto mb-4">
        <MdOutlineMarkEmailUnread className="text-4xl text-accent" aria-hidden="true" />
      </div>
      <h2 className="text-ink text-2xl font-bold mb-1.5">{t('Enter the code')}</h2>
      <p className="text-ink-soft text-sm leading-relaxed max-w-[380px] mx-auto">
        {t('We sent a verification code to')}
        <span className="block text-ink font-semibold break-all">{email}</span>
      </p>
      <p className="text-ink-faint text-xs mt-1">{t("Check your Spam or Promotions folder if you can't find it.")}</p>

      <input
        ref={inputRef}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label={t('Verification code')}
        placeholder="000000"
        className="block w-full max-w-[260px] mx-auto mt-5 mb-5 bg-surface-sunken border border-border text-ink placeholder-ink-faint/50 rounded-xl py-3.5 text-center text-2xl font-bold tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
      />

      {uploadWarning ? (
        <div className="bg-warning-soft border border-warning-strong/25 text-warning-strong text-sm rounded-lg px-4 py-3 mb-4 max-w-[400px] mx-auto text-left flex gap-2">
          <MdOutlineWarningAmber className="text-xl flex-shrink-0" aria-hidden="true" />
          {uploadWarning}
        </div>
      ) : (
        <div className="text-success-strong text-sm font-medium mb-4 flex items-center justify-center gap-1.5">
          <MdOutlineCheckCircle aria-hidden="true" /> {t('Your ID and face photo were received')}
        </div>
      )}

      {error && (
        <div role="alert" className="bg-danger-soft border border-danger-strong/20 text-danger-strong text-sm rounded-lg px-4 py-2.5 mb-4 max-w-[400px] mx-auto">
          {error}
        </div>
      )}
      {note && !error && <div className="bg-info-soft border border-info-strong/20 text-info-strong text-sm rounded-lg px-4 py-2.5 mb-4 max-w-[400px] mx-auto">{note}</div>}

      <button
        type="submit"
        disabled={busy || code.length < 6}
        className="w-full max-w-[320px] bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-ink font-semibold text-sm rounded-xl py-3 shadow-token-md"
      >
        {busy ? t('Verifying...') : t('Verify and continue')}
      </button>

      <div className="mt-5 text-sm text-ink-soft">
        {t("Didn't get the code?")}{' '}
        {wait > 0 ? (
          <span className="text-ink-faint">{t('Resend in {s}s', { s: wait })}</span>
        ) : (
          <button type="button" onClick={resend} className="text-accent font-semibold">
            {t('Resend code')}
          </button>
        )}
      </div>
      <div className="mt-2 text-sm text-ink-soft">
        {t('Wrong email?')}{' '}
        <button type="button" onClick={onStartOver} className="text-accent font-semibold">
          {t('Change it')}
        </button>
      </div>
    </form>
  )
}

export default CheckEmailStep
