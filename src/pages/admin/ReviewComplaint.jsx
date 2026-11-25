import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MdArrowBack,
  MdOutlinePerson,
  MdOutlinePersonOff,
  MdOutlineSearchOff,
  MdOutlineCheckCircle,
  MdOutlineBlock,
  MdOutlineFactCheck,
  MdOutlineSchedule,
  MdOutlineHowToReg,
} from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../../context/toastContext'
import AdminLayout from '../../components/layout/AdminLayout'
import { Card, StatusBadge, EmptyState, Skeleton, Button, LinkButton, ConfirmDialog, Select, Textarea } from '../../components/ui'
import ComplaintDetails from '../../components/admin/ComplaintDetails'
import IdentityPanel from '../../components/admin/IdentityPanel'
import { useT } from '../../i18n/LanguageContext'

const DECLINE_REASONS = [
  'Outside the jurisdiction of Barangay New Kababae',
  'Parties do not live in the same city or municipality',
  'Not covered by Katarungang Pambarangay (Sec. 408 exceptions)',
  'Duplicate of an existing complaint',
  'Other legal ground',
]

const APPEARANCE_REASONS = [
  'Identity needs to be verified in person',
  'Details of the complaint need to be clarified',
  'The complaint needs to be confirmed in person',
]

const DIALOGS = {
  decline: {
    reasons: DECLINE_REASONS,
    other: 'Other legal ground',
    icon: MdOutlineBlock,
    iconCls: 'bg-danger-soft text-danger-strong',
    title: 'Decline this complaint?',
    message: 'Decline only on a legal ground. The resident will see the reason and can still file at the Barangay Hall. This cannot be undone.',
    confirm: 'Decline complaint',
    variant: 'danger',
  },
  appearance: {
    reasons: APPEARANCE_REASONS,
    other: null,
    icon: MdOutlineHowToReg,
    iconCls: 'bg-warning-soft text-warning-strong',
    title: 'Require personal appearance?',
    message: 'The complaint stays on record. No summons is issued until the complainant confirms it in person at the Barangay Hall.',
    confirm: 'Require appearance',
    variant: 'primary',
  },
}

function ReasonDialog({ mode, busy, onCancel, onSubmit }) {
  const { t } = useT()
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  if (!mode) return null
  const d = DIALOGS[mode]
  const Icon = d.icon
  const needsDetails = reason === d.other
  const valid = reason && (!needsDetails || details.trim())

  function submit() {
    if (!valid) return
    onSubmit(details.trim() ? `${reason}. ${details.trim()}` : reason)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-5" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reason-title"
        className="bg-surface border border-border rounded-2xl p-6 max-w-[480px] w-full shadow-token-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5 mb-5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${d.iconCls}`}>
            <Icon className="text-2xl" aria-hidden="true" />
          </div>
          <div>
            <div id="reason-title" className="text-ink text-lg font-bold mb-1">{t(d.title)}</div>
            <div className="text-ink-soft text-sm leading-relaxed">{t(d.message)}</div>
          </div>
        </div>

        <label className="block text-sm font-semibold text-ink-soft mb-1.5">{t('Reason *')}</label>
        <Select value={reason} onChange={(e) => setReason(e.target.value)} className="mb-4">
          <option value="">{t('Choose a reason')}</option>
          {d.reasons.map((r) => (
            <option key={r} value={r}>
              {t(r)}
            </option>
          ))}
        </Select>

        <label className="block text-sm font-semibold text-ink-soft mb-1.5">
          {t('Explanation')} {needsDetails ? '*' : <span className="font-normal text-ink-faint">{t('(optional)')}</span>}
        </label>
        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          placeholder={t('Add a short explanation the resident will understand')}
          className="mb-5"
        />

        <div className="flex gap-2.5 justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            {t('Cancel')}
          </Button>
          <Button variant={d.variant} onClick={submit} disabled={!valid || busy}>
            {busy ? t('Please wait...') : t(d.confirm)}
          </Button>
        </div>
      </div>
    </div>
  )
}

function waiting(createdAt, now) {
  const days = Math.floor((now - new Date(createdAt).getTime()) / 86400000)
  if (days < 1) return { label: 'submitted today', cls: 'text-ink-faint' }
  if (days === 1) return { label: 'waiting 1 day', cls: 'text-warning-strong font-semibold' }
  return { label: 'waiting {n} days', n: days, cls: 'text-danger-strong font-semibold' }
}

function ReviewComplaint() {
  const { t } = useT()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [data, setData] = useState({ id: null, complaint: null, reviewer: null })
  const [now] = useState(() => Date.now())
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: c } = await supabase.from('complaints').select('*, profiles(full_name)').eq('id', id).maybeSingle()
      let reviewer = null
      if (c?.reviewed_by) {
        const { data: r } = await supabase.from('profiles').select('full_name').eq('id', c.reviewed_by).maybeSingle()
        reviewer = r?.full_name || null
      }
      if (!cancelled) setData({ id, complaint: c, reviewer })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  async function review(decision, reason) {
    setBusy(true)
    const { error } = await supabase.rpc('review_complaint', {
      p_complaint_id: Number(id),
      p_decision: decision,
      p_reason: reason || null,
    })
    setBusy(false)
    setAcceptOpen(false)
    setDialog(null)
    if (error) {
      toast.error(`${t('The decision could not be saved.')} ${error.message}`)
      return
    }
    if (decision === 'accept') {
      toast.success(t('Complaint accepted. It is now in Active Cases and the resident has been notified.'))
      navigate(`/admin/cases/${id}`)
    } else if (decision === 'appearance') {
      toast.success(t('The resident has been asked to confirm the complaint in person.'))
      navigate('/admin/complaints')
    } else {
      toast.success(t('Complaint declined. The resident has been notified of the reason.'))
      navigate('/admin/complaints')
    }
  }

  if (data.id !== id) {
    return (
      <AdminLayout title={t('Review Complaint')}>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-20 w-2/3" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </AdminLayout>
    )
  }

  const complaint = data.complaint
  if (!complaint) {
    return (
      <AdminLayout title={t('Review Complaint')}>
        <Card>
          <EmptyState
            icon={MdOutlineSearchOff}
            title={t('Complaint not found')}
            message={t('This complaint may have been removed, or the link is incorrect.')}
            action={<LinkButton to="/admin/complaints">{t('Back to New Complaints')}</LinkButton>}
          />
        </Card>
      </AdminLayout>
    )
  }

  const isDeclined = complaint.status === 'declined'
  const waitingAppearance = complaint.status === 'for_appearance' || complaint.status === 'not_confirmed'
  const dueText = complaint.appearance_due
    ? new Date(complaint.appearance_due).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—'
  const wait = waiting(complaint.created_at, now)
  const residentName = complaint.profiles?.full_name || complaint.complainant_name || t('The resident')

  return (
    <AdminLayout title={t('Review Complaint')}>
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-5">
        <div>
          <button onClick={() => navigate('/admin/complaints')} className="text-sm text-accent font-semibold mb-3 flex items-center gap-1">
            <MdArrowBack aria-hidden="true" />{t('Back to New Complaints')}
          </button>
          <div className="text-ink-faint text-sm font-mono">{complaint.reference_number}</div>
          <div className="text-ink text-xl font-bold">{t(complaint.category)}</div>
          <div className="text-ink-soft text-sm mt-0.5">
            {t('Submitted by {name} on {date}', {
              name: residentName,
              date: new Date(complaint.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            })}
            {complaint.status === 'submitted' && <span className={`${wait.cls}`}> · {t(wait.label, { n: wait.n })}</span>}
          </div>
        </div>
        <StatusBadge status={complaint.status} size="lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <ComplaintDetails complaint={complaint} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-ink-soft text-sm font-semibold mb-2 flex items-center gap-1.5">
                <MdOutlinePerson className="text-lg text-accent" aria-hidden="true" />{t('Complainant')}
              </div>
              <div className="text-ink text-sm">{complaint.complainant_name}</div>
              {complaint.complainant_contact && <div className="text-ink-soft text-sm mt-0.5">{complaint.complainant_contact}</div>}
              <div className="text-ink-faint text-sm mt-1">{complaint.complainant_address}</div>
            </Card>
            <Card className="p-4">
              <div className="text-ink-soft text-sm font-semibold mb-2 flex items-center gap-1.5">
                <MdOutlinePersonOff className="text-lg text-accent" aria-hidden="true" />{t('Respondent')}
              </div>
              <div className="text-ink text-sm">{complaint.respondent_name}</div>
              <div className="text-ink-faint text-sm mt-1">{complaint.respondent_address}</div>
            </Card>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <IdentityPanel userId={complaint.user_id} />

          {isDeclined ? (
            <Card className="p-5 border-danger-strong/30">
              <div className="flex items-center gap-2 mb-2 text-danger-strong">
                <MdOutlineBlock className="text-xl" aria-hidden="true" />
                <div className="text-base font-semibold">{t('Declined')}</div>
              </div>
              <div className="text-xs text-ink-faint uppercase tracking-wide mb-1">{t('Reason shown to the resident')}</div>
              <div className="text-ink text-sm leading-relaxed bg-danger-soft border border-danger-strong/20 rounded-lg p-3 mb-3">
                {complaint.declined_reason || '—'}
              </div>
              <div className="text-ink-faint text-xs">
                {data.reviewer ? t('Declined by {name}', { name: data.reviewer }) : t('Declined')}
                {complaint.reviewed_at &&
                  ` · ${new Date(complaint.reviewed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
              </div>
            </Card>
          ) : waitingAppearance ? (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <MdOutlineHowToReg className="text-xl text-warning-strong" aria-hidden="true" />
                <div className="text-ink text-base font-semibold">
                  {complaint.status === 'not_confirmed' ? t('Not confirmed in person') : t('Waiting for personal appearance')}
                </div>
              </div>
              <div className="text-ink-soft text-sm leading-relaxed mb-3">
                {complaint.status === 'not_confirmed'
                  ? t('The complainant did not appear by {date}. The complaint stays on record and can still continue if they come.', { date: dueText })
                  : t('{name} must confirm this complaint at the Barangay Hall by {date}.', { name: residentName, date: dueText })}
              </div>
              {complaint.appearance_reason && (
                <div className="text-sm bg-surface-sunken border border-border rounded-lg p-3 mb-4">
                  <div className="text-xs text-ink-faint uppercase tracking-wide mb-1">{t('Reason')}</div>
                  <div className="text-ink">{t(complaint.appearance_reason)}</div>
                </div>
              )}
              <div className="flex flex-col gap-2.5">
                <Button size="lg" icon={MdOutlineCheckCircle} onClick={() => setAcceptOpen(true)} disabled={busy}>
                  {t('Confirm appearance and accept')}
                </Button>
                <Button size="lg" variant="dangerOutline" icon={MdOutlineBlock} onClick={() => setDialog('decline')} disabled={busy}>
                  {t('Decline')}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <MdOutlineFactCheck className="text-xl text-accent" aria-hidden="true" />
                <div className="text-ink text-base font-semibold">{t('Your decision')}</div>
              </div>
              <div className="text-ink-soft text-sm leading-relaxed mb-4">
                {t("Check the details and the complainant's identity first. If you accept, this becomes an active case and you can issue the summons.")}
              </div>
              <div className="bg-warning-soft border border-warning-strong/20 text-warning-strong text-sm rounded-lg p-3 mb-4 flex gap-2 leading-relaxed">
                <MdOutlineSchedule className="text-lg flex-shrink-0 mt-0.5" aria-hidden="true" />
                {t('The respondent should be summoned by the next working day after a complaint is received.')}
              </div>
              <div className="flex flex-col gap-2.5">
                <Button size="lg" icon={MdOutlineCheckCircle} onClick={() => setAcceptOpen(true)} disabled={busy}>
                  {t('Accept complaint')}
                </Button>
                <Button size="lg" variant="secondary" icon={MdOutlineHowToReg} onClick={() => setDialog('appearance')} disabled={busy}>
                  {t('Require personal appearance')}
                </Button>
                <Button size="lg" variant="dangerOutline" icon={MdOutlineBlock} onClick={() => setDialog('decline')} disabled={busy}>
                  {t('Decline')}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={acceptOpen}
        tone="primary"
        title={waitingAppearance ? t('Confirm appearance and accept?') : t('Accept this complaint?')}
        message={
          waitingAppearance
            ? t('Confirm only if {name} is here in person and has confirmed the complaint. It will move to Active Cases.', { name: residentName })
            : t("It will move to Active Cases and {name} will be notified. Make sure you have checked the complainant's identity.", { name: residentName })
        }
        confirmLabel={t('Yes, accept')}
        loading={busy}
        onConfirm={() => review('accept')}
        onCancel={() => setAcceptOpen(false)}
      />
      <ReasonDialog key={dialog} mode={dialog} busy={busy} onCancel={() => setDialog(null)} onSubmit={(reason) => review(dialog, reason)} />
    </AdminLayout>
  )
}

export default ReviewComplaint
