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
} from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../../context/toastContext'
import AdminLayout from '../../components/layout/AdminLayout'
import { Card, StatusBadge, EmptyState, Skeleton, Button, LinkButton, ConfirmDialog, Select, Textarea } from '../../components/ui'
import ComplaintDetails from '../../components/admin/ComplaintDetails'
import IdentityPanel from '../../components/admin/IdentityPanel'

const DECLINE_REASONS = [
  'Outside Katarungang Pambarangay jurisdiction',
  'Parties do not live in the same city or municipality',
  'Incomplete or unclear information',
  'Identity could not be verified',
  'Duplicate of an existing complaint',
  'Other',
]

function DeclineDialog({ open, busy, onCancel, onSubmit }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const needsDetails = reason === 'Other'
  const valid = reason && (!needsDetails || details.trim())

  if (!open) return null

  function submit() {
    if (!valid) return
    onSubmit(details.trim() ? `${reason}. ${details.trim()}` : reason)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-5" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="decline-title"
        className="bg-surface border border-border rounded-2xl p-6 max-w-[480px] w-full shadow-token-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-xl bg-danger-soft text-danger-strong flex items-center justify-center flex-shrink-0">
            <MdOutlineBlock className="text-2xl" aria-hidden="true" />
          </div>
          <div>
            <div id="decline-title" className="text-ink text-lg font-bold mb-1">Decline this complaint?</div>
            <div className="text-ink-soft text-sm leading-relaxed">The resident will see the reason you give. This cannot be undone.</div>
          </div>
        </div>

        <label className="block text-sm font-semibold text-ink-soft mb-1.5">Reason *</label>
        <Select value={reason} onChange={(e) => setReason(e.target.value)} className="mb-4">
          <option value="">Choose a reason</option>
          {DECLINE_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>

        <label className="block text-sm font-semibold text-ink-soft mb-1.5">
          Explanation {needsDetails ? '*' : <span className="font-normal text-ink-faint">(optional)</span>}
        </label>
        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          placeholder="Add a short explanation the resident will understand"
          className="mb-5"
        />

        <div className="flex gap-2.5 justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submit} disabled={!valid || busy}>
            {busy ? 'Please wait...' : 'Decline complaint'}
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
  return { label: `waiting ${days} days`, cls: 'text-danger-strong font-semibold' }
}

function ReviewComplaint() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [data, setData] = useState({ id: null, complaint: null, reviewer: null })
  const [now] = useState(() => Date.now())
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [declineOpen, setDeclineOpen] = useState(false)
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
    setDeclineOpen(false)
    if (error) {
      toast.error(`The decision could not be saved. ${error.message}`)
      return
    }
    if (decision === 'accept') {
      toast.success('Complaint accepted. It is now in Active Cases and the resident has been notified.')
      navigate(`/admin/cases/${id}`)
    } else {
      toast.success('Complaint declined. The resident has been notified of the reason.')
      navigate('/admin/complaints')
    }
  }

  if (data.id !== id) {
    return (
      <AdminLayout title="Review Complaint">
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
      <AdminLayout title="Review Complaint">
        <Card>
          <EmptyState
            icon={MdOutlineSearchOff}
            title="Complaint not found"
            message="This complaint may have been removed, or the link is incorrect."
            action={<LinkButton to="/admin/complaints">Back to New Complaints</LinkButton>}
          />
        </Card>
      </AdminLayout>
    )
  }

  const isDeclined = complaint.status === 'declined'
  const wait = waiting(complaint.created_at, now)
  const residentName = complaint.profiles?.full_name || complaint.complainant_name || 'The resident'

  return (
    <AdminLayout title="Review Complaint">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-5">
        <div>
          <button onClick={() => navigate('/admin/complaints')} className="text-sm text-accent font-semibold mb-3 flex items-center gap-1">
            <MdArrowBack aria-hidden="true" /> Back to New Complaints
          </button>
          <div className="text-ink-faint text-sm font-mono">{complaint.reference_number}</div>
          <div className="text-ink text-xl font-bold">{complaint.category}</div>
          <div className="text-ink-soft text-sm mt-0.5">
            Submitted by {residentName} on{' '}
            {new Date(complaint.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {!isDeclined && <span className={`${wait.cls}`}> · {wait.label}</span>}
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
                <MdOutlinePerson className="text-lg text-accent" aria-hidden="true" /> Complainant
              </div>
              <div className="text-ink text-sm">{complaint.complainant_name}</div>
              {complaint.complainant_contact && <div className="text-ink-soft text-sm mt-0.5">{complaint.complainant_contact}</div>}
              <div className="text-ink-faint text-sm mt-1">{complaint.complainant_address}</div>
            </Card>
            <Card className="p-4">
              <div className="text-ink-soft text-sm font-semibold mb-2 flex items-center gap-1.5">
                <MdOutlinePersonOff className="text-lg text-accent" aria-hidden="true" /> Respondent
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
                <div className="text-base font-semibold">Declined</div>
              </div>
              <div className="text-xs text-ink-faint uppercase tracking-wide mb-1">Reason shown to the resident</div>
              <div className="text-ink text-sm leading-relaxed bg-danger-soft border border-danger-strong/20 rounded-lg p-3 mb-3">
                {complaint.declined_reason || '—'}
              </div>
              <div className="text-ink-faint text-xs">
                {data.reviewer ? `Declined by ${data.reviewer}` : 'Declined'}
                {complaint.reviewed_at &&
                  ` on ${new Date(complaint.reviewed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
              </div>
            </Card>
          ) : (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <MdOutlineFactCheck className="text-xl text-accent" aria-hidden="true" />
                <div className="text-ink text-base font-semibold">Your decision</div>
              </div>
              <div className="text-ink-soft text-sm leading-relaxed mb-4">
                Check the details and the complainant's identity first. If you accept, this becomes an active case and you can issue the summons.
              </div>
              <div className="bg-warning-soft border border-warning-strong/20 text-warning-strong text-sm rounded-lg p-3 mb-4 flex gap-2 leading-relaxed">
                <MdOutlineSchedule className="text-lg flex-shrink-0 mt-0.5" aria-hidden="true" />
                The respondent should be summoned by the next working day after a complaint is received.
              </div>
              <div className="flex flex-col gap-2.5">
                <Button size="lg" icon={MdOutlineCheckCircle} onClick={() => setAcceptOpen(true)} disabled={busy}>
                  Accept complaint
                </Button>
                <Button size="lg" variant="dangerOutline" icon={MdOutlineBlock} onClick={() => setDeclineOpen(true)} disabled={busy}>
                  Decline
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={acceptOpen}
        tone="primary"
        title="Accept this complaint?"
        message={`It will move to Active Cases and ${residentName} will be notified. Make sure you have checked the complainant's identity.`}
        confirmLabel="Yes, accept"
        loading={busy}
        onConfirm={() => review('accept')}
        onCancel={() => setAcceptOpen(false)}
      />
      <DeclineDialog open={declineOpen} busy={busy} onCancel={() => setDeclineOpen(false)} onSubmit={(reason) => review('decline', reason)} />
    </AdminLayout>
  )
}

export default ReviewComplaint
