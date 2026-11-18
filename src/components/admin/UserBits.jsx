import { createPortal } from 'react-dom'
import { useState } from 'react'
import { MdOutlineAdminPanelSettings, MdOutlineVerifiedUser, MdOutlinePendingActions, MdOutlineBlock, MdClose } from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../../context/toastContext'
import { Button, Field, Select, Textarea } from '../ui'
import { isOfficial } from '../../lib/accounts'
import { useT } from '../../i18n/LanguageContext'

export function UserBadges({ u }) {
  const { t } = useT()
  return (
    <div className="flex flex-wrap gap-1.5">
      {isOfficial(u.role) ? (
        <span className="inline-flex items-center gap-1 rounded-full text-xs font-semibold px-2.5 py-1 bg-purple-soft text-purple-strong">
          <MdOutlineAdminPanelSettings className="text-[1.15em]" aria-hidden="true" />
          {u.official_title || t('Admin')}
        </span>
      ) : u.verified_at ? (
        <span className="inline-flex items-center gap-1 rounded-full text-xs font-semibold px-2.5 py-1 bg-success-soft text-success-strong">
          <MdOutlineVerifiedUser className="text-[1.15em]" aria-hidden="true" />{t('Verified')}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full text-xs font-semibold px-2.5 py-1 bg-warning-soft text-warning-strong">
          <MdOutlinePendingActions className="text-[1.15em]" aria-hidden="true" />{t('Not verified')}
        </span>
      )}
      {u.effective_status !== 'active' && (
        <span className="inline-flex items-center gap-1 rounded-full text-xs font-semibold px-2.5 py-1 bg-danger-soft text-danger-strong">
          <MdOutlineBlock className="text-[1.15em]" aria-hidden="true" />
          {u.effective_status === 'blocked' ? t('Blocked') : t('Restricted')}
        </span>
      )}
    </div>
  )
}

export function Avatar({ name, size = 'w-10 h-10 text-sm' }) {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return <div className={`${size} rounded-full bg-accent flex items-center justify-center text-accent-ink font-bold flex-shrink-0`}>{initials}</div>
}

const DURATIONS = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '', label: 'Until removed' },
]

export function StatusDialog({ mode, user, onClose, onDone }) {
  const { t } = useT()
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [days, setDays] = useState('7')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!mode) return null
  const block = mode === 'blocked'

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: rpcError } = await supabase.rpc('set_account_status', {
      p_user: user.id,
      p_status: mode,
      p_reason: reason.trim(),
      p_days: block || !days ? null : Number(days),
    })
    setSaving(false)
    if (rpcError) return setError(rpcError.message)
    toast.success(t(block ? '{name} has been blocked.' : '{name} can no longer file complaints.', { name: user.full_name }))
    setReason('')
    onDone()
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-5" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-2xl p-6 max-w-[460px] w-full shadow-token-lg flex flex-col gap-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-ink text-lg font-bold">{block ? t('Block this account') : t('Restrict this account')}</div>
            <div className="text-ink-soft text-sm mt-0.5">
              {block
                ? t('{name} will not be able to use the app at all until you unblock them.', { name: user.full_name })
                : t('{name} can still log in and view their cases, but cannot file new complaints.', { name: user.full_name })}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={t('Close')} className="text-ink-faint hover:text-ink p-1">
            <MdClose className="text-xl" aria-hidden="true" />
          </button>
        </div>
        {!block && (
          <Field label={t('How long')}>
            <Select value={days} onChange={(e) => setDays(e.target.value)}>
              {DURATIONS.map((d) => (
                <option key={d.label} value={d.value}>
                  {t(d.label)}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={t('Reason')} required hint={t('The user will see this reason.')}>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder={t(block ? 'e.g. Repeated fake complaints and abusive messages' : 'e.g. Filed several spam complaints')}
          />
        </Field>
        {error && (
          <div role="alert" className="bg-danger-soft border border-danger-strong/20 text-danger-strong text-sm rounded-lg px-3.5 py-2.5">
            {error}
          </div>
        )}
        <div className="flex gap-2.5 justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {t('Cancel')}
          </Button>
          <Button type="submit" variant="danger" disabled={saving || !reason.trim()}>
            {saving ? t('Saving...') : block ? t('Block account') : t('Restrict account')}
          </Button>
        </div>
      </form>
    </div>,
    document.body
  )
}

