import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/layout/AdminLayout'

const STAGES = [
  { key: 'filed', label: 'Filed' },
  { key: 'summoned', label: 'Summoned' },
  { key: 'mediation', label: 'Mediation' },
  { key: 'pangkat_formed', label: 'Pangkat Formed' },
  { key: 'pangkat_hearing', label: 'Pangkat Hearing' },
  { key: 'outcome', label: 'Settled / CFA' },
]

const OUTCOME_STAGES = ['settled', 'cfa_issued', 'dismissed']

const STAGE_META = {
  filed: { badge: 'bg-amber-500/15 text-amber-300', next: ['summoned', 'dismissed'], action: 'Issue a summons to the respondent, then set a hearing date to move this case to mediation.' },
  summoned: { badge: 'bg-sky-500/15 text-sky-300', next: ['mediation', 'dismissed'], action: 'Once the respondent is notified, proceed to mediation before the Punong Barangay.' },
  mediation: { badge: 'bg-blue-500/15 text-blue-300', next: ['pangkat_formed', 'settled', 'dismissed'], action: 'If mediation fails, constitute a Pangkat to continue conciliation. If it succeeds, record the settlement.' },
  pangkat_formed: { badge: 'bg-purple-500/15 text-purple-300', next: ['pangkat_hearing'], action: 'Assign 3 Pangkat members, then schedule the Pangkat hearing.' },
  pangkat_hearing: { badge: 'bg-purple-500/15 text-purple-300', next: ['settled', 'cfa_issued'], action: 'Record the hearing outcome — a settlement, or issue a Certificate to File Action if unresolved.' },
  settled: { badge: 'bg-green-500/15 text-green-300', next: [], action: 'Case settled. This case is closed.' },
  cfa_issued: { badge: 'bg-gray-400/15 text-gray-300', next: [], action: 'Certificate to File Action issued. The complainant may now file with court or the prosecutor.' },
  dismissed: { badge: 'bg-red-500/15 text-red-300', next: [], action: 'Case dismissed. This case is closed.' },
}

const STAGE_LABELS = {
  filed: 'Filed', summoned: 'Summoned', mediation: 'Mediation',
  pangkat_formed: 'Pangkat Formed', pangkat_hearing: 'Pangkat Hearing',
  settled: 'Settled', cfa_issued: 'CFA Issued', dismissed: 'Dismissed',
}

const FORM_LABELS = {
  7: 'Complaint',
  8: 'Notice of Hearing',
  9: 'Summons',
  10: 'Pangkat Constitution Notice',
  11: 'Notice to Pangkat Member',
  13: 'Subpoena',
  14: 'Arbitration Agreement',
  15: 'Arbitration Award',
  16: 'Amicable Settlement',
  18: 'Notice — Complainant No-Show',
  19: 'Notice — Respondent No-Show',
  20: 'Certificate to File Action',
  22: 'CFA (Pangkat No-Show)',
  25: 'Motion for Execution',
  27: 'Notice of Execution',
}

const FORMS_BY_STAGE = {
  filed: [7],
  summoned: [7, 8, 9],
  mediation: [7, 9, 13, 14, 15, 18, 19],
  pangkat_formed: [7, 10, 11, 13, 14, 15, 18, 19, 22],
  pangkat_hearing: [7, 13, 14, 15, 18, 19, 22],
  settled: [7, 16, 25, 27],
  cfa_issued: [7, 20, 22],
  dismissed: [7],
}

function currentTrackerIndex(status) {
  if (OUTCOME_STAGES.includes(status)) return 5
  return STAGES.findIndex((s) => s.key === status)
}

function CaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
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
  const [saving, setSaving] = useState(false)

  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('member')

  async function loadAll() {
    setLoading(true)
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
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) return <AdminLayout title="Case Detail"><div className="text-blue-200/50 text-center py-14">Loading...</div></AdminLayout>
  if (!complaint) return <AdminLayout title="Case Detail"><div className="text-blue-200/50 text-center py-14">Case not found.</div></AdminLayout>

  const meta = STAGE_META[complaint.status] || STAGE_META.filed
  const trackerIdx = currentTrackerIndex(complaint.status)
  const availableForms = FORMS_BY_STAGE[complaint.status] || [7]

  function openAdvanceModal() {
    setSelectedNextStage(meta.next[0] || '')
    setAdvanceRemarks('')
    setSettlementTerms(complaint.settlement_terms || '')
    setCfaReason('')
    setCfaRepudiatedBy('')
    setShowAdvanceModal(true)
  }

  async function confirmAdvance() {
    if (!selectedNextStage) return
    setSaving(true)

    await supabase
      .from('complaints')
      .update({
        status: selectedNextStage,
        hearing_date: hearingDate || null,
        hearing_time: hearingTime || null,
        settlement_terms: selectedNextStage === 'settled' ? settlementTerms : complaint.settlement_terms,
        cfa_reason: selectedNextStage === 'cfa_issued' ? `${cfaReason}${cfaRepudiatedBy ? ` (Repudiated by: ${cfaRepudiatedBy})` : ''}` : complaint.cfa_reason,
        cfa_issued_at: selectedNextStage === 'cfa_issued' ? new Date().toISOString() : complaint.cfa_issued_at,
      })
      .eq('id', id)

    await supabase.from('case_activity_log').insert({
      complaint_id: id,
      entry_type: 'stage_change',
      stage: selectedNextStage,
      remarks: advanceRemarks || `Stage changed to ${STAGE_LABELS[selectedNextStage]}`,
      created_by: profile?.id,
    })

    const NOTIF = {
      summoned: { title: '📋 Summons Issued', type: 'info', msg: 'The respondent has been summoned. A hearing will follow.' },
      mediation: { title: '🤝 Mediation Stage', type: 'info', msg: 'Your case has moved to mediation before the Punong Barangay.' },
      pangkat_formed: { title: '👥 Pangkat Formed', type: 'info', msg: 'A Pangkat has been formed to conciliate your case.' },
      pangkat_hearing: { title: '📋 Pangkat Hearing', type: 'info', msg: 'A Pangkat hearing has been scheduled for your case.' },
      settled: { title: '✅ Case Settled', type: 'success', msg: 'Your case has been settled.' },
      cfa_issued: { title: '📄 Certificate to File Action Issued', type: 'warning', msg: 'A Certificate to File Action has been issued for your case.' },
      dismissed: { title: '✗ Case Dismissed', type: 'danger', msg: 'Your case has been dismissed.' },
    }
    const n = NOTIF[selectedNextStage]
    if (n) {
      await supabase.from('complaint_notifications').insert({
        complaint_id: id,
        user_id: complaint.user_id,
        title: n.title,
        type: n.type,
        message: `${n.msg} (Ref: ${complaint.reference_number})`,
      })
    }

    setSaving(false)
    setShowAdvanceModal(false)
    loadAll()
  }

  async function addNote() {
    if (!noteText.trim()) return
    setSavingNote(true)
    await supabase.from('case_activity_log').insert({
      complaint_id: id,
      entry_type: 'note',
      remarks: noteText,
      created_by: profile?.id,
    })
    setNoteText('')
    setSavingNote(false)
    loadAll()
  }

  async function addMember() {
    if (!newMemberName.trim()) return
    await supabase.from('pangkat_members').insert({
      complaint_id: id,
      member_name: newMemberName,
      role: newMemberRole,
    })
    setNewMemberName('')
    setNewMemberRole('member')
    loadAll()
  }

  async function removeMember(memberId) {
    await supabase.from('pangkat_members').delete().eq('id', memberId)
    loadAll()
  }

  return (
    <AdminLayout title="Case Detail">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <button onClick={() => navigate('/admin/complaints')} className="text-xs text-blue-300 mb-2">‹ Back to All Complaints</button>
          <div className="text-blue-200/50 text-xs font-mono">{complaint.reference_number}</div>
          <div className="text-white text-xl font-bold">{complaint.category}</div>
          <div className="text-blue-200/60 text-sm mt-0.5">
            Filed by {complaint.profiles?.full_name || '—'} against {complaint.respondent_name || '—'}
          </div>
        </div>
        <span className={`${meta.badge} text-xs font-semibold px-3 py-1.5 rounded-full`}>
          {STAGE_LABELS[complaint.status]}
        </span>
      </div>

      {/* Stage Tracker */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 mb-4">
        <div className="text-blue-200/50 text-xs mb-3">Case stage</div>
        <div className="flex items-center">
          {STAGES.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-2.5 h-2.5 rounded-full ${i <= trackerIdx ? 'bg-blue-400' : 'bg-white/15'}`} />
                <div className={`text-[11px] mt-1.5 text-center ${i <= trackerIdx ? 'text-white' : 'text-blue-200/30'}`}>{s.label}</div>
              </div>
              {i < STAGES.length - 1 && <div className={`flex-1 h-0.5 ${i < trackerIdx ? 'bg-blue-400' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Next Action */}
      <div className="bg-blue-500/15 border border-blue-400/25 rounded-2xl p-5 mb-4">
        <div className="text-blue-200 text-sm font-semibold mb-1.5">Next action</div>
        <div className="text-white text-[13.5px] mb-3.5">{meta.action}</div>
        {meta.next.length > 0 && (
          <button onClick={openAdvanceModal} className="bg-blue-500/90 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg px-5 py-2 border border-blue-400/30">
            Advance stage ›
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4">
          <div className="text-blue-200/50 text-xs mb-2">Complainant</div>
          <div className="text-white text-sm">{complaint.complainant_name}</div>
          <div className="text-blue-200/50 text-xs mt-1">{complaint.complainant_address}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4">
          <div className="text-blue-200/50 text-xs mb-2">Respondent</div>
          <div className="text-white text-sm">{complaint.respondent_name}</div>
          <div className="text-blue-200/50 text-xs mt-1">{complaint.respondent_address}</div>
        </div>
      </div>

      {/* Pangkat Members */}
      {(members.length > 0 || complaint.status === 'pangkat_formed' || complaint.status === 'pangkat_hearing') && (
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4 mb-4">
          <div className="text-blue-200/50 text-xs mb-2.5">Pangkat members (3 required)</div>
          {members.length === 0 ? (
            <div className="text-blue-200/40 text-sm mb-3">No members assigned yet.</div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-3">
              {members.map((m) => (
                <span key={m.id} className="bg-white/10 text-white text-xs px-3 py-1.5 rounded-full border border-white/15 flex items-center gap-2">
                  {m.member_name}{m.role === 'chairman' ? ' (Chairman)' : ''}
                  <button onClick={() => removeMember(m.id)} className="text-red-300 hover:text-red-200">✕</button>
                </span>
              ))}
            </div>
          )}
          {members.length < 3 && (
            <div className="flex gap-2">
              <input
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Member name"
                className="flex-1 bg-white/10 border border-white/20 text-white placeholder-blue-200/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              />
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-2.5 py-2 text-sm [color-scheme:dark]"
              >
                <option value="member">Member</option>
                <option value="chairman">Chairman</option>
              </select>
              <button onClick={addMember} disabled={!newMemberName.trim()} className="bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-lg px-4 border border-white/20 disabled:opacity-50">
                Add
              </button>
            </div>
          )}
        </div>
      )}

      {/* Settlement / CFA summary, once recorded */}
      {complaint.status === 'settled' && complaint.settlement_terms && (
        <div className="bg-green-500/10 border border-green-400/25 rounded-2xl p-4 mb-4">
          <div className="text-green-300 text-xs mb-1.5">Settlement terms</div>
          <div className="text-white text-sm">{complaint.settlement_terms}</div>
        </div>
      )}
      {complaint.status === 'cfa_issued' && complaint.cfa_reason && (
        <div className="bg-gray-400/10 border border-gray-400/25 rounded-2xl p-4 mb-4">
          <div className="text-gray-300 text-xs mb-1.5">CFA reason</div>
          <div className="text-white text-sm">{complaint.cfa_reason}</div>
        </div>
      )}

      {/* Documents — stage-aware, labeled */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4 mb-4">
        <div className="text-blue-200/50 text-xs mb-2.5">Documents available at this stage</div>
        <div className="flex flex-wrap gap-2">
          {availableForms.map((n) => (
            <Link
              key={n}
              to={`/admin/complaints/${id}/form${n}`}
              target="_blank"
              className="text-xs font-semibold text-white border border-green-400/30 bg-green-500/20 rounded-md px-2.5 py-1.5"
            >
              {FORM_LABELS[n] || `Form ${n}`}
            </Link>
          ))}
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4">
        <div className="text-blue-200/50 text-xs mb-3">Activity log</div>

        <div className="flex gap-2 mb-4">
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note or minutes from a meeting..."
            className="flex-1 bg-white/10 border border-white/20 text-white placeholder-blue-200/30 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          />
          <button onClick={addNote} disabled={savingNote} className="bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-lg px-4 border border-white/20 disabled:opacity-50">
            Add
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="text-blue-200/40 text-sm">No activity yet.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {logs.map((l) => (
              <div key={l.id} className="flex gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${l.entry_type === 'stage_change' ? 'bg-blue-400' : 'bg-white/30'}`} />
                <div>
                  <div className="text-[13px] text-blue-100/80">{l.remarks}</div>
                  <div className="text-[11px] text-blue-200/40">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5" onClick={() => setShowAdvanceModal(false)}>
          <div className="bg-blue-950/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-6 max-w-[460px] w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-white text-lg font-bold mb-1">Advance case stage</div>
            <div className="text-blue-200/50 text-xs mb-4">This updates the case status and notifies the resident. This action reflects a legal step — confirm before proceeding.</div>

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-blue-200/50 mb-1.5">New stage</label>
              <select
                value={selectedNextStage}
                onChange={(e) => setSelectedNextStage(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 [color-scheme:dark]"
              >
                {meta.next.map((s) => (
                  <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                ))}
              </select>
            </div>

            {(selectedNextStage === 'summoned' || selectedNextStage === 'pangkat_hearing') && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-blue-200/50 mb-1.5">Hearing date</label>
                  <input type="date" value={hearingDate} onChange={(e) => setHearingDate(e.target.value)} className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3.5 py-2.5 text-sm [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-blue-200/50 mb-1.5">Hearing time</label>
                  <input type="time" value={hearingTime} onChange={(e) => setHearingTime(e.target.value)} className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3.5 py-2.5 text-sm [color-scheme:dark]" />
                </div>
              </div>
            )}

            {selectedNextStage === 'settled' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wide text-blue-200/50 mb-1.5">Settlement Terms</label>
                <textarea
                  value={settlementTerms}
                  onChange={(e) => setSettlementTerms(e.target.value)}
                  rows={3}
                  placeholder="What did both parties agree to?"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/30 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-vertical"
                />
              </div>
            )}

            {selectedNextStage === 'cfa_issued' && (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-blue-200/50 mb-1.5">Repudiated By</label>
                  <input
                    value={cfaRepudiatedBy}
                    onChange={(e) => setCfaRepudiatedBy(e.target.value)}
                    placeholder="Name of party who repudiated the settlement"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/30 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-blue-200/50 mb-1.5">Reason for CFA</label>
                  <textarea
                    value={cfaReason}
                    onChange={(e) => setCfaReason(e.target.value)}
                    rows={3}
                    placeholder="Why is a Certificate to File Action being issued?"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/30 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-vertical"
                  />
                </div>
              </>
            )}

            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-blue-200/50 mb-1.5">Remarks</label>
              <textarea
                value={advanceRemarks}
                onChange={(e) => setAdvanceRemarks(e.target.value)}
                rows={3}
                placeholder="Notes about this stage change..."
                className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/30 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-vertical"
              />
            </div>

            <div className="flex gap-2.5">
              <button onClick={() => setShowAdvanceModal(false)} className="flex-1 border border-white/20 text-blue-200/80 rounded-lg py-2.5 text-sm font-medium">Cancel</button>
              <button onClick={confirmAdvance} disabled={saving} className="flex-[2] bg-blue-500/90 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg py-2.5 border border-blue-400/30">
                {saving ? 'Saving...' : 'Confirm and advance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default CaseDetail