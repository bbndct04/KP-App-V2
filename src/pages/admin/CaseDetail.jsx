import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CFA_TYPES, DISMISSAL_REASONS } from '../../lib/outcomes'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/layout/AdminLayout'
import { useToast } from '../../context/toastContext'
import {
  MdArrowBack,
  MdArrowForward,
  MdClose,
  MdOutlineFlag,
  MdOutlineTipsAndUpdates,
  MdOutlinePerson,
  MdOutlinePersonOff,
  MdOutlineGroups,
  MdOutlineDescription,
  MdOutlinePrint,
  MdOutlineHistory,
  MdOutlineSearchOff,
  MdOutlineCheckCircle,
} from 'react-icons/md'
import { Card, StatusBadge, EmptyState, Skeleton, LinkButton, ConfirmDialog } from '../../components/ui'
import { STATUS } from '../../components/status'
import ComplaintDetails from '../../components/admin/ComplaintDetails'
import IdentityPanel from '../../components/admin/IdentityPanel'
import { DeadlineBadge } from '../../components/cases'
import { caseDeadline } from '../../lib/cases'

function stageDatesFromLogs(logs) {
  const dates = {}
  for (const l of logs) {
    if (l.entry_type === 'stage_change' && ['summoned', 'pangkat_formed', 'arbitration'].includes(l.stage)) {
      if (!dates[l.stage] || l.created_at > dates[l.stage]) dates[l.stage] = l.created_at
    }
  }
  return dates
}

const STAGES = [
  { key: 'filed', label: 'Filed' },
  { key: 'summoned', label: 'Summoned' },
  { key: 'mediation', label: 'Mediation' },
  { key: 'pangkat_formed', label: 'Pangkat Formed' },
  { key: 'pangkat_hearing', label: 'Conciliation' },
  { key: 'outcome', label: 'Outcome' },
  { key: 'closed', label: 'Closed' },
]

const OUTCOME_STAGES = ['settled', 'execution', 'cfa_issued', 'dismissed']
const FINAL_STAGES = ['closed', 'cfa_issued', 'dismissed']

const STAGE_META = {
  filed: { next: ['summoned', 'dismissed'], action: 'Issue a summons to the respondent and a notice of hearing to the complainant, then set the mediation hearing.' },
  summoned: { next: ['mediation', 'pangkat_formed', 'dismissed'], action: 'Once both parties are notified, proceed to mediation before the Punong Barangay. If the respondent does not appear, the case may be referred to the Pangkat.' },
  mediation: { next: ['settled', 'pangkat_formed', 'arbitration', 'dismissed'], action: 'Mediation runs up to 15 days. Record a settlement if reached. If it fails, constitute a Pangkat within 15 days. Parties may also agree to arbitration.' },
  pangkat_formed: { next: ['pangkat_hearing', 'settled', 'arbitration', 'cfa_issued', 'dismissed'], action: 'Assign 3 Pangkat members, then schedule the conciliation hearing.' },
  pangkat_hearing: { next: ['settled', 'arbitration', 'cfa_issued', 'dismissed'], action: 'Conciliation runs 15 days, extendable by 15. Record a settlement, or issue a Certificate to File Action if no settlement is reached.' },
  arbitration: { next: ['settled', 'cfa_issued', 'dismissed'], action: 'Hold the arbitration hearing. Issue the arbitration award within 15 days of the last hearing (not earlier than 6 days).' },
  execution: { next: ['closed'], action: 'Enforce the settlement or award (Motion for Execution, Notice of Hearing, Notice of Execution). This must be done within 6 months of the settlement.' },
  closed: { next: [], action: 'The settlement was complied with. This case is closed.' },
  cfa_issued: { next: [], action: 'Certificate to File Action issued. The complainant may now file with court or the proper government office.' },
  dismissed: { next: [], action: 'Case dismissed. This case is closed.' },
}

const STAGE_LABELS = {
  filed: 'Filed',
  summoned: 'Summoned',
  mediation: 'Mediation',
  pangkat_formed: 'Pangkat Formed',
  pangkat_hearing: 'Conciliation',
  arbitration: 'Arbitration',
  settled: 'Settled',
  execution: 'Execution (not complied)',
  closed: 'Closed (complied)',
  cfa_issued: 'Certificate to File Action',
  dismissed: 'Dismissed',
}

const DAY = 86400000

function settlementWindow(c) {
  if (!c.settled_at) return null
  const finalAt = new Date(new Date(c.settled_at).getTime() + 10 * DAY)
  const daysLeft = Math.ceil((finalAt - Date.now()) / DAY)
  return { finalAt, daysLeft, isFinal: daysLeft <= 0, executionDeadline: new Date(new Date(c.settled_at).getTime() + 182 * DAY) }
}

function nextStagesFor(c) {
  if (c.status !== 'settled') return (STAGE_META[c.status] || STAGE_META.filed).next
  const w = settlementWindow(c)
  return w && !w.isFinal ? ['cfa_issued'] : ['closed', 'execution']
}

const longDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

const FORM_LABELS = {
  7: 'Complaint',
  8: 'Notice of Hearing (Mediation)',
  9: 'Summons',
  10: 'Notice for Constitution of Pangkat',
  11: 'Notice to Chosen Pangkat Member',
  12: 'Notice of Hearing (Conciliation)',
  13: 'Subpoena',
  14: 'Agreement for Arbitration',
  15: 'Arbitration Award',
  16: 'Amicable Settlement',
  17: 'Repudiation',
  18: 'Notice of Hearing (Complainant Failed to Appear)',
  19: 'Notice of Hearing (Respondent Failed to Appear)',
  20: 'Certification to File Action (Repudiated Settlement)',
  21: 'Certification to File Action (No Settlement)',
  22: 'Certification to File Action (Respondent Did Not Appear)',
  23: 'Certification to Bar Action',
  24: 'Certification to Bar Counterclaim',
  25: 'Motion for Execution',
  26: 'Notice of Hearing (Motion for Execution)',
  27: 'Notice of Execution',
}

const FORM_GROUPS = [
  { title: 'Complaint and mediation', forms: [7, 8, 9] },
  { title: 'Pangkat and conciliation', forms: [10, 11, 12, 13] },
  { title: 'Failure to appear', forms: [18, 19] },
  { title: 'Arbitration', forms: [14, 15] },
  { title: 'Settlement and repudiation', forms: [16, 17] },
  { title: 'Certifications', forms: [20, 21, 22, 23, 24] },
  { title: 'Execution', forms: [25, 26, 27] },
]

const SUGGESTED_BY_STAGE = {
  filed: [7, 8, 9],
  summoned: [8, 9, 13, 18, 19],
  mediation: [13, 14, 16, 18, 19],
  pangkat_formed: [10, 11, 12],
  pangkat_hearing: [12, 13, 14, 15, 16, 18, 19],
  arbitration: [13, 14, 15],
  settled: [16, 17, 15],
  execution: [25, 26, 27],
  closed: [16],
  cfa_issued: [20, 21, 22],
  dismissed: [23, 24],
}

function currentTrackerIndex(status, hasPangkat) {
  if (status === 'closed') return 6
  if (status === 'arbitration') return hasPangkat ? 4 : 2
  if (OUTCOME_STAGES.includes(status)) return 5
  return STAGES.findIndex((s) => s.key === status)
}

function CaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const toast = useToast()
  const [docStatus, setDocStatus] = useState({})

  useEffect(() => {
    let cancelled = false
    async function run() {
      const { data } = await supabase.from('case_documents').select('form_no, status').eq('complaint_id', id).neq('status', 'void')
      if (!cancelled) setDocStatus(Object.fromEntries((data || []).map((d) => [d.form_no, d.status])))
    }
    run()
    return () => {
      cancelled = true
    }
  }, [id])
  const [complaint, setComplaint] = useState(null)
  const [logs, setLogs] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [selectedNextStage, setSelectedNextStage] = useState('')
  const [advanceRemarks, setAdvanceRemarks] = useState('')
  const [hearingDate, setHearingDate] = useState('')
  const [hearingTime, setHearingTime] = useState('')
  const [settlementTerms, setSettlementTerms] = useState('')
  const [cfaReason, setCfaReason] = useState('')
  const [cfaRepudiatedBy, setCfaRepudiatedBy] = useState('')
  const [cfaType, setCfaType] = useState('no_settlement')
  const [dismissalReason, setDismissalReason] = useState('')
  const [saving, setSaving] = useState(false)

  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('member')
  const [memberToRemove, setMemberToRemove] = useState(null)

  async function loadAll() {
    const [{ data: c }, { data: l }, { data: m }] = await Promise.all([
      supabase.from('complaints').select('*, profiles(full_name)').eq('id', id).single(),
      supabase.from('case_activity_log').select('*, profiles(full_name, official_title)').eq('complaint_id', id).order('created_at', { ascending: false }),
      supabase.from('pangkat_members').select('*').eq('complaint_id', id).order('created_at'),
    ])
    setComplaint(c)
    setLogs(l || [])
    setMembers(m || [])
    setHearingDate(c?.hearing_date || '')
    setHearingTime(c?.hearing_time || '')
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading)
    return (
      <AdminLayout title="Case Detail">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-20 w-2/3" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </AdminLayout>
    )
  if (!complaint)
    return (
      <AdminLayout title="Case Detail">
        <Card>
          <EmptyState
            icon={MdOutlineSearchOff}
            title="Case not found"
            message="This case may have been removed, or the link is incorrect."
            action={<LinkButton to="/admin/cases">Back to Active Cases</LinkButton>}
          />
        </Card>
      </AdminLayout>
    )

  const meta = STAGE_META[complaint.status] || STAGE_META.filed
  const nextStages = nextStagesFor(complaint)
  const win = ['settled', 'execution', 'closed'].includes(complaint.status) ? settlementWindow(complaint) : null
  const trackerIdx = FINAL_STAGES.includes(complaint.status) && complaint.status !== 'closed' ? 5 : currentTrackerIndex(complaint.status, members.length > 0)
  const suggestedForms = SUGGESTED_BY_STAGE[complaint.status] || [7]

  function openAdvanceModal(stage) {
    const target = typeof stage === 'string' ? stage : nextStages[0] || ''
    setSelectedNextStage(target)
    setAdvanceRemarks('')
    setSettlementTerms(complaint.settlement_terms || '')
    setCfaReason('')
    setCfaRepudiatedBy('')
    setCfaType(complaint.status === 'settled' ? 'repudiated' : complaint.status === 'pangkat_formed' ? 'respondent_refused' : 'no_settlement')
    setDismissalReason('')
    setShowAdvanceModal(true)
  }

  async function confirmAdvance() {
    if (!selectedNextStage) return
    setSaving(true)

    const { error } = await supabase.rpc('advance_case', {
      p_complaint_id: Number(id),
      p_next_stage: selectedNextStage,
      p_remarks: advanceRemarks || null,
      p_hearing_date: hearingDate || null,
      p_hearing_time: hearingTime || null,
      p_settlement_terms: selectedNextStage === 'settled' ? settlementTerms : null,
      p_cfa_reason:
        selectedNextStage === 'cfa_issued' && cfaType === 'repudiated'
          ? `${cfaReason}${cfaRepudiatedBy ? ` (Repudiated by: ${cfaRepudiatedBy})` : ''}`
          : null,
      p_cfa_type: selectedNextStage === 'cfa_issued' ? cfaType : null,
      p_dismissal_reason: selectedNextStage === 'dismissed' ? dismissalReason || null : null,
    })

    setSaving(false)
    if (error) {
      toast.error(`The case could not be updated. ${error.message}`)
      return
    }

    setShowAdvanceModal(false)
    toast.success(`Case moved to ${STAGE_LABELS[selectedNextStage]}. The resident has been notified.`)
    loadAll()
  }

  async function addNote() {
    if (!noteText.trim()) return
    setSavingNote(true)
    const { error } = await supabase.from('case_activity_log').insert({
      complaint_id: id,
      entry_type: 'note',
      remarks: noteText,
      created_by: profile?.id,
    })
    setSavingNote(false)
    if (error) {
      toast.error(`The note could not be saved. ${error.message}`)
      return
    }
    setNoteText('')
    toast.success('Note added to the activity log.')
    loadAll()
  }

  async function addMember() {
    if (!newMemberName.trim()) return
    const { error } = await supabase.from('pangkat_members').insert({
      complaint_id: id,
      member_name: newMemberName,
      role: newMemberRole,
    })
    if (error) {
      toast.error(`The member could not be added. ${error.message}`)
      return
    }
    setNewMemberName('')
    setNewMemberRole('member')
    toast.success('Pangkat member added.')
    loadAll()
  }

  async function removeMember(memberId) {
    const { error } = await supabase.from('pangkat_members').delete().eq('id', memberId)
    if (error) {
      toast.error(`The member could not be removed. ${error.message}`)
      return
    }
    toast.success('Pangkat member removed.')
    loadAll()
  }

  return (
    <AdminLayout title="Case Detail">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-5">
        <div>
          <button onClick={() => navigate('/admin/cases')} className="text-sm text-accent font-semibold mb-3 flex items-center gap-1">
            <MdArrowBack aria-hidden="true" /> Back to Active Cases
          </button>
          <div className="text-ink-faint text-sm font-mono">{complaint.reference_number}</div>
          <div className="text-ink text-xl font-bold">{complaint.category}</div>
          <div className="text-ink-soft text-sm mt-0.5">
            Filed by {complaint.profiles?.full_name || '—'} against {complaint.respondent_name || '—'}
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
          <StatusBadge status={complaint.status} size="lg" />
          <DeadlineBadge deadline={caseDeadline(complaint, stageDatesFromLogs(logs))} />
        </div>
      </div>

      {/* Stage Tracker */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-4 shadow-token-md overflow-x-auto">
        <div className="text-ink-soft text-sm font-semibold mb-4">Case stage</div>
        <div className="flex items-start min-w-[600px]">
          {STAGES.map((s, i) => {
            const isOutcome = s.key === 'outcome'
            const Icon = isOutcome ? (i === trackerIdx ? STATUS[complaint.status]?.icon : null) || MdOutlineFlag : STATUS[s.key]?.icon || MdOutlineFlag
            const reached = i <= trackerIdx
            return (
              <div key={s.key} className="flex items-start flex-1 last:flex-none">
                <div className="flex flex-col items-center w-24">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      reached ? 'bg-accent text-accent-ink' : 'bg-surface-sunken text-ink-faint border border-border'
                    } ${i === trackerIdx ? 'ring-4 ring-accent/20' : ''}`}
                  >
                    <Icon className="text-xl" aria-hidden="true" />
                  </div>
                  <div className={`text-xs mt-2 text-center leading-tight ${reached ? 'text-ink font-semibold' : 'text-ink-faint'}`}>{s.label}</div>
                </div>
                {i < STAGES.length - 1 && <div className={`flex-1 h-0.5 mt-5 ${i < trackerIdx ? 'bg-accent' : 'bg-border'}`} />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Next Action */}
      <div className="bg-accent-soft border border-accent/25 rounded-2xl p-5 mb-4">
        <div className="text-accent text-sm font-semibold mb-1.5 flex items-center gap-1.5"><MdOutlineTipsAndUpdates className="text-lg" aria-hidden="true" /> Next action</div>
        {complaint.status === 'settled' && win ? (
          win.isFinal ? (
            <>
              <div className="text-ink text-sm mb-3.5">
                The settlement became final on <strong>{longDate(win.finalAt)}</strong>. Has the obliged party complied with it? If not, it must be executed by{' '}
                <strong>{longDate(win.executionDeadline)}</strong> (6 months from the settlement).
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => openAdvanceModal('closed')} className="bg-accent hover:bg-accent-hover text-accent-ink text-sm font-semibold rounded-lg h-11 px-5 shadow-token-sm inline-flex items-center gap-2">
                  <MdOutlineCheckCircle aria-hidden="true" /> Complied, close case
                </button>
                <button onClick={() => openAdvanceModal('execution')} className="border border-border bg-surface text-ink text-sm font-semibold rounded-lg h-11 px-5 inline-flex items-center gap-2 hover:bg-surface-hover">
                  Not complied, start execution
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-ink text-sm mb-3.5">
                Repudiation period: <strong>{win.daysLeft} day{win.daysLeft === 1 ? '' : 's'} left</strong>. The settlement becomes final on <strong>{longDate(win.finalAt)}</strong>. If a party
                repudiates it in a sworn statement (Form 17) on the ground of fraud, violence or intimidation, record it to issue a Certificate to File Action (Form 20).
              </div>
              <button onClick={() => openAdvanceModal('cfa_issued')} className="border border-border bg-surface text-ink text-sm font-semibold rounded-lg h-11 px-5 inline-flex items-center gap-2 hover:bg-surface-hover">
                Record repudiation
              </button>
            </>
          )
        ) : (
          <>
            <div className="text-ink text-sm mb-3.5">
              {meta.action}
              {complaint.status === 'execution' && win && (
                <>
                  {' '}
                  Execution deadline: <strong>{longDate(win.executionDeadline)}</strong>.
                </>
              )}
            </div>
            {nextStages.length > 0 && (
              <button onClick={openAdvanceModal} className="bg-accent hover:bg-accent-hover text-accent-ink text-sm font-semibold rounded-lg h-11 px-5 shadow-token-sm inline-flex items-center gap-2">
                {complaint.status === 'execution' ? 'Mark as complied' : 'Advance stage'} <MdArrowForward aria-hidden="true" />
              </button>
            )}
          </>
        )}
        {complaint.status === 'filed' && (
          <Link
            to={`/admin/complaints/${id}/form9`}
            target="_blank"
            className="ml-2 mt-2 sm:mt-0 border border-border bg-surface text-ink text-sm font-semibold rounded-lg h-11 px-5 inline-flex items-center gap-2 hover:bg-surface-hover"
          >
            <MdOutlinePrint aria-hidden="true" /> Prepare summons
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-token-md">
          <div className="text-ink-soft text-sm font-semibold mb-2 flex items-center gap-1.5"><MdOutlinePerson className="text-lg text-accent" aria-hidden="true" /> Complainant</div>
          <div className="text-ink text-sm">{complaint.complainant_name}</div>
          <div className="text-ink-faint text-xs mt-1">{complaint.complainant_address}</div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-token-md">
          <div className="text-ink-soft text-sm font-semibold mb-2 flex items-center gap-1.5"><MdOutlinePersonOff className="text-lg text-accent" aria-hidden="true" /> Respondent</div>
          <div className="text-ink text-sm">{complaint.respondent_name}</div>
          <div className="text-ink-faint text-xs mt-1">{complaint.respondent_address}</div>
        </div>
      </div>

      <ComplaintDetails complaint={complaint} className="mb-4" />
      <IdentityPanel userId={complaint.user_id} collapsible defaultOpen={false} className="mb-4" />

      {/* Pangkat Members */}
      {(members.length > 0 || complaint.status === 'pangkat_formed' || complaint.status === 'pangkat_hearing') && (
        <div className="bg-surface border border-border rounded-2xl p-4 mb-4 shadow-token-md">
          <div className="text-ink-soft text-sm font-semibold mb-3 flex items-center gap-1.5"><MdOutlineGroups className="text-lg text-accent" aria-hidden="true" /> Pangkat members (3 required)</div>
          {members.length === 0 ? (
            <div className="text-ink-faint text-sm mb-3">No members assigned yet.</div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-3">
              {members.map((m) => (
                <span key={m.id} className="bg-surface-sunken text-ink text-sm px-3.5 py-1.5 rounded-full border border-border flex items-center gap-2">
                  {m.member_name}{m.role === 'chairman' ? ' (Chairman)' : ''}
                  <button onClick={() => setMemberToRemove(m)} aria-label={`Remove ${m.member_name}`} className="text-danger-strong hover:opacity-70 flex items-center"><MdClose aria-hidden="true" /></button>
                </span>
              ))}
            </div>
          )}
          {members.length < 3 && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Member name"
                className="flex-1 bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="bg-surface-sunken border border-border text-ink rounded-lg px-2.5 py-2 text-sm"
              >
                <option value="member">Member</option>
                <option value="chairman">Chairman</option>
              </select>
              <button onClick={addMember} disabled={!newMemberName.trim()} className="bg-surface-sunken hover:bg-surface-hover text-ink text-sm font-semibold rounded-lg px-4 border border-border disabled:opacity-50">
                Add
              </button>
            </div>
          )}
        </div>
      )}

      {/* Settlement / CFA summary, once recorded */}
      {complaint.settlement_terms && ['settled', 'execution', 'closed'].includes(complaint.status) && (
        <div className="bg-success-soft border border-success-strong/20 rounded-2xl p-4 mb-4">
          <div className="text-success-strong text-xs font-semibold mb-1.5">
            {complaint.settlement_type === 'arbitration_award' ? 'Arbitration award' : 'Amicable settlement'}
            {complaint.settled_at && ` · ${longDate(complaint.settled_at)}`}
          </div>
          <div className="text-ink text-sm whitespace-pre-line">{complaint.settlement_terms}</div>
        </div>
      )}
      {complaint.status === 'cfa_issued' && (complaint.cfa_type || complaint.cfa_reason) && (
        <div className="bg-neutral-soft border border-neutral-strong/20 rounded-2xl p-4 mb-4">
          <div className="text-neutral-strong text-xs font-semibold mb-1.5">Certificate to File Action</div>
          {complaint.cfa_type && <div className="text-ink text-sm">{CFA_TYPES[complaint.cfa_type]}</div>}
          {complaint.cfa_reason && <div className="text-ink-soft text-sm mt-1">{complaint.cfa_reason}</div>}
        </div>
      )}
      {complaint.status === 'dismissed' && complaint.dismissal_reason && (
        <div className="bg-danger-soft border border-danger-strong/20 rounded-2xl p-4 mb-4">
          <div className="text-danger-strong text-xs font-semibold mb-1.5">Reason for dismissal</div>
          <div className="text-ink text-sm">{DISMISSAL_REASONS[complaint.dismissal_reason]}</div>
        </div>
      )}

      {/* KP Forms — all forms available; current-stage forms are marked as suggested */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-4 shadow-token-md">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="text-ink-soft text-sm font-semibold flex items-center gap-1.5">
            <MdOutlineDescription className="text-lg text-accent" aria-hidden="true" /> KP Forms
          </div>
          <div className="text-ink-faint text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent" aria-hidden="true" /> Suggested for the {STAGE_LABELS[complaint.status] || 'current'} stage
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          {FORM_GROUPS.map((g) => (
            <div key={g.title}>
              <div className="text-ink-faint text-xs font-semibold uppercase tracking-wide mb-1.5">{g.title}</div>
              <div className="flex flex-wrap gap-2">
                {g.forms.map((n) => {
                  const suggested = suggestedForms.includes(n)
                  return (
                    <Link
                      key={n}
                      to={`/admin/complaints/${id}/form${n}`}
                      target="_blank"
                      className={`text-sm font-semibold rounded-md px-3 py-1.5 inline-flex items-center gap-1.5 border transition-colors ${
                        suggested
                          ? 'text-accent border-accent/40 bg-accent-soft hover:border-accent'
                          : 'text-ink-soft border-border bg-surface hover:bg-surface-hover hover:text-ink'
                      }`}
                    >
                      <MdOutlinePrint aria-hidden="true" />
                      {FORM_LABELS[n] || `Form ${n}`}
                      {docStatus[n] && (
                        <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${docStatus[n] === 'issued' ? 'bg-success-strong text-white' : 'bg-warning-soft text-warning-strong'}`}>
                          {docStatus[n] === 'issued' ? 'Issued' : 'Draft'}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-token-md">
        <div className="text-ink-soft text-sm font-semibold mb-3 flex items-center gap-1.5"><MdOutlineHistory className="text-lg text-accent" aria-hidden="true" /> Activity log</div>

        <div className="flex gap-2 mb-4">
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note or minutes from a meeting..."
            className="flex-1 bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <button onClick={addNote} disabled={savingNote} className="bg-surface-sunken hover:bg-surface-hover text-ink text-sm font-semibold rounded-lg px-4 border border-border disabled:opacity-50">
            Add
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="text-ink-faint text-sm">No activity yet.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {logs.map((l) => (
              <div key={l.id} className="flex gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${l.entry_type === 'stage_change' ? 'bg-accent' : 'bg-ink-faint'}`} />
                <div>
                  <div className="text-sm text-ink-soft">{l.remarks}</div>
                  <div className="text-xs text-ink-faint">
                    {new Date(l.created_at).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    {l.profiles?.full_name && ` — ${l.profiles.official_title || l.profiles.full_name}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Advance Stage Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-5" onClick={() => setShowAdvanceModal(false)}>
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-[460px] w-full shadow-token-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="text-ink text-lg font-bold mb-1">
              {selectedNextStage === 'closed' ? 'Close the case' : selectedNextStage === 'execution' ? 'Start execution' : 'Advance case stage'}
            </div>
            <div className="text-ink-faint text-xs mb-4">This updates the case status and notifies the resident. This action reflects a legal step — confirm before proceeding.</div>

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint mb-1.5">New stage</label>
              <select
                value={selectedNextStage}
                onChange={(e) => setSelectedNextStage(e.target.value)}
                className="w-full bg-surface-sunken border border-border text-ink rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                {nextStages.map((s) => (
                  <option key={s} value={s}>
                    {s === 'settled' && complaint.status === 'arbitration' ? 'Arbitration award' : s === 'cfa_issued' && complaint.status === 'settled' ? 'Repudiated → Certificate to File Action' : STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            {['summoned', 'pangkat_formed', 'pangkat_hearing', 'arbitration'].includes(selectedNextStage) && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint mb-1.5">Hearing date</label>
                  <input type="date" value={hearingDate} onChange={(e) => setHearingDate(e.target.value)} className="w-full bg-surface-sunken border border-border text-ink rounded-lg px-3.5 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint mb-1.5">Hearing time</label>
                  <input type="time" value={hearingTime} onChange={(e) => setHearingTime(e.target.value)} className="w-full bg-surface-sunken border border-border text-ink rounded-lg px-3.5 py-2.5 text-sm" />
                </div>
              </div>
            )}

            {selectedNextStage === 'settled' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint mb-1.5">
                  {complaint.status === 'arbitration' ? 'Arbitration award' : 'Settlement terms'}
                </label>
                <textarea
                  value={settlementTerms}
                  onChange={(e) => setSettlementTerms(e.target.value)}
                  rows={3}
                  placeholder="What did both parties agree to?"
                  className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-vertical"
                />
              </div>
            )}

            {selectedNextStage === 'settled' && (
              <div className="mb-4 text-xs text-ink-soft bg-surface-sunken border border-border rounded-lg px-3 py-2.5">
                Either party may repudiate within 10 days. The case stays open until you record whether it was complied with.
              </div>
            )}

            {selectedNextStage === 'dismissed' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint mb-1.5">Reason for dismissal</label>
                <select
                  value={dismissalReason}
                  onChange={(e) => setDismissalReason(e.target.value)}
                  className="w-full bg-surface-sunken border border-border text-ink rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="">Choose a reason</option>
                  {Object.entries(DISMISSAL_REASONS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                {dismissalReason === 'complainant_failed_to_appear' && (
                  <div className="text-xs text-ink-faint mt-1.5">Prepare the Certification to Bar Action (Form 23).</div>
                )}
              </div>
            )}

            {selectedNextStage === 'cfa_issued' && complaint.status !== 'settled' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint mb-1.5">Reason for the certificate</label>
                <select
                  value={cfaType}
                  onChange={(e) => setCfaType(e.target.value)}
                  className="w-full bg-surface-sunken border border-border text-ink rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {Object.entries(CFA_TYPES)
                    .filter(([k]) => k !== 'repudiated' || complaint.status === 'arbitration')
                    .map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {selectedNextStage === 'cfa_issued' && cfaType === 'repudiated' && (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint mb-1.5">Repudiated By</label>
                  <input
                    value={cfaRepudiatedBy}
                    onChange={(e) => setCfaRepudiatedBy(e.target.value)}
                    placeholder="Name of party who repudiated the settlement"
                    className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint mb-1.5">Ground (fraud, violence or intimidation)</label>
                  <textarea
                    value={cfaReason}
                    onChange={(e) => setCfaReason(e.target.value)}
                    rows={3}
                    placeholder="State the ground and details from the sworn statement"
                    className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-vertical"
                  />
                </div>
              </>
            )}

            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint mb-1.5">Remarks</label>
              <textarea
                value={advanceRemarks}
                onChange={(e) => setAdvanceRemarks(e.target.value)}
                rows={3}
                placeholder="Notes about this stage change..."
                className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-vertical"
              />
            </div>

            <div className="flex gap-2.5">
              <button onClick={() => setShowAdvanceModal(false)} className="flex-1 border border-border text-ink-soft rounded-lg py-2.5 text-sm font-medium">Cancel</button>
              <button onClick={confirmAdvance} disabled={saving || (selectedNextStage === 'dismissed' && !dismissalReason)} className="flex-[2] bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-ink font-semibold text-sm rounded-lg py-2.5 shadow-token-sm">
                {saving ? 'Saving...' : 'Confirm and advance'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={!!memberToRemove}
        title="Remove Pangkat member?"
        message={`${memberToRemove?.member_name || 'This member'} will be removed from this case's Pangkat.`}
        confirmLabel="Yes, remove"
        onConfirm={async () => {
          await removeMember(memberToRemove.id)
          setMemberToRemove(null)
        }}
        onCancel={() => setMemberToRemove(null)}
      />
    </AdminLayout>
  )
}

export default CaseDetail