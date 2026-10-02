import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'

const BADGES = {
  filed: { bg: 'bg-warning-soft', text: 'text-warning-strong', label: 'Filed' },
  summoned: { bg: 'bg-info-soft', text: 'text-info-strong', label: 'Summoned' },
  mediation: { bg: 'bg-accent-soft', text: 'text-accent', label: 'Mediation' },
  pangkat_formed: { bg: 'bg-purple-soft', text: 'text-purple-strong', label: 'Pangkat Formed' },
  pangkat_hearing: { bg: 'bg-purple-soft', text: 'text-purple-strong', label: 'Pangkat Hearing' },
  settled: { bg: 'bg-success-soft', text: 'text-success-strong', label: 'Settled' },
  cfa_issued: { bg: 'bg-neutral-soft', text: 'text-neutral-strong', label: 'CFA Issued' },
  dismissed: { bg: 'bg-danger-soft', text: 'text-danger-strong', label: 'Dismissed' },
}

const STEPS = [
  { key: 'filed', label: 'Complaint Filed', icon: '📥', desc: 'Your complaint has been received by the Barangay.' },
  { key: 'summoned', label: 'Summons Issued', icon: '📨', desc: 'The respondent has been summoned to appear.' },
  { key: 'mediation', label: 'Mediation', icon: '🤝', desc: 'The Punong Barangay is mediating between both parties.' },
  { key: 'pangkat_formed', label: 'Pangkat Formed', icon: '👥', desc: 'A 3-member Pangkat has been formed to continue conciliation.' },
  { key: 'pangkat_hearing', label: 'Pangkat Hearing', icon: '📋', desc: 'The Pangkat is hearing both parties to reach a settlement.' },
  { key: 'outcome', label: 'Settled / CFA', icon: '🎉', desc: 'The case has reached a final outcome.' },
]

const OUTCOME_STAGES = ['settled', 'cfa_issued', 'dismissed']

function currentIndex(status) {
  if (OUTCOME_STAGES.includes(status)) return 5
  return STEPS.findIndex((s) => s.key === status)
}

function TrackStatus() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [refInput, setRefInput] = useState(searchParams.get('ref') || '')
  const [complaint, setComplaint] = useState(null)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  async function runSearch(ref) {
    if (!ref) return
    setLoading(true)
    setSearched(true)
    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('reference_number', ref)
      .eq('user_id', user.id)
      .single()
    setComplaint(data || null)
    setLoading(false)
  }

  useState(() => {
    const ref = searchParams.get('ref')
    if (ref) runSearch(ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })

  function handleSubmit(e) {
    e.preventDefault()
    setSearchParams({ ref: refInput })
    runSearch(refInput)
  }

  const currentIdx = complaint ? currentIndex(complaint.status) : -1
  const isOutcome = complaint && OUTCOME_STAGES.includes(complaint.status)

  return (
    <AppLayout title="Track Status">
      {/* Search Bar */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-5 max-w-[600px] shadow-token-md">
        <div className="text-ink text-[15px] font-semibold mb-1">Track Your Complaint</div>
        <div className="text-ink-faint text-[13px] mb-3.5">Enter your reference number to see the current status</div>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            placeholder="e.g. KP-2026-001"
            className="flex-1 min-w-0 bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <button type="submit" className="bg-accent hover:bg-accent-hover text-accent-ink text-sm font-semibold rounded-lg px-6 py-2.5 sm:py-0 shadow-token-sm">
            Search
          </button>
        </form>
      </div>

      {!searched && (
        <div className="bg-surface border border-border rounded-2xl p-8 md:p-12 text-center max-w-[500px] shadow-token-md">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-ink text-[15px] font-semibold mb-1.5">Enter a Reference Number</div>
          <div className="text-ink-faint text-[13.5px] mb-4">
            Your reference number was given after submitting a complaint. It looks like <strong className="text-ink">KP-2026-001</strong>.
          </div>
          <Link to="/my-reports" className="inline-flex items-center gap-2 bg-surface-sunken hover:bg-surface-hover text-ink border border-border rounded-lg px-5 py-2.5 text-sm font-semibold">
            View All My Reports
          </Link>
        </div>
      )}

      {searched && !loading && !complaint && (
        <div className="bg-surface border border-border rounded-2xl p-8 md:p-12 text-center max-w-[500px] shadow-token-md">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-ink text-base font-semibold mb-1.5">Complaint Not Found</div>
          <div className="text-ink-faint text-[13.5px] mb-4">
            No complaint found with reference number <strong className="text-ink">{refInput}</strong>. Make sure you entered the correct reference number.
          </div>
          <Link to="/my-reports" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-ink rounded-lg px-5 py-2.5 text-sm font-semibold shadow-token-sm">
            View My Reports
          </Link>
        </div>
      )}

      {complaint && (
        <>
          {/* Case Info */}
          <div className="bg-accent-soft border border-accent/20 rounded-2xl px-5 md:px-6 py-5 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[11px] text-ink-faint uppercase tracking-wide mb-1">Reference Number</div>
              <div className="text-xl font-bold text-ink font-mono">{complaint.reference_number}</div>
            </div>
            <div>
              <div className="text-[11px] text-ink-faint uppercase tracking-wide mb-1">Category</div>
              <div className="text-[15px] font-semibold text-ink">{complaint.category}</div>
            </div>
            <div>
              <div className="text-[11px] text-ink-faint uppercase tracking-wide mb-1">Date Filed</div>
              <div className="text-[15px] font-semibold text-ink">
                {new Date(complaint.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5 items-start">
            {/* Timeline */}
            <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 min-w-0 shadow-token-md">
              <div className="text-ink text-[15px] font-semibold mb-5">Case Progress Timeline</div>

              {STEPS.map((step, i) => {
                const isDone = i < currentIdx
                const isActive = i === currentIdx
                const isFinal = step.key === 'outcome'
                const isDismissedFinal = isFinal && isActive && complaint.status === 'dismissed'
                return (
                  <div key={step.key} className="flex gap-3.5 pb-6 last:pb-0 relative">
                    {i < STEPS.length - 1 && (
                      <div className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-border" />
                    )}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10 ${
                        isDismissedFinal
                          ? 'bg-red-500 border-red-500'
                          : isDone
                          ? 'bg-accent border-accent'
                          : isActive
                          ? 'bg-accent border-accent'
                          : 'bg-surface-sunken border-border'
                      }`}
                    >
                      {isDone ? (
                        <span className="text-white text-xs">✓</span>
                      ) : isActive ? (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-ink-faint" />
                      )}
                    </div>
                    <div className="flex-1 pt-0.5 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-sm font-semibold ${isDone || isActive ? 'text-ink' : 'text-ink-faint'}`}>
                          {isFinal && isActive ? (BADGES[complaint.status]?.label || step.label) : step.label}
                        </span>
                        {isActive && (
                          <span className="bg-accent-soft text-accent px-2 py-0.5 rounded-full text-[11px] font-semibold">Current</span>
                        )}
                      </div>
                      <div className={`text-[12.5px] leading-relaxed ${i > currentIdx ? 'text-ink-faint' : 'text-ink-soft'}`}>
                        {step.desc}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right Info */}
            <div className="flex flex-col gap-3.5 min-w-0">
              <div className="bg-surface border border-border rounded-2xl p-4.5 text-center shadow-token-md">
                <div className="text-[12px] text-ink-faint uppercase tracking-wide mb-2">Current Stage</div>
                {(() => {
                  const b = BADGES[complaint.status] || BADGES.filed
                  return <span className={`${b.bg} ${b.text} px-5 py-2 rounded-full text-[15px] font-bold`}>{b.label}</span>
                })()}
              </div>

              {complaint.hearing_date && !isOutcome && (
                <div className="bg-warning-soft border border-warning-strong/20 rounded-2xl p-4.5">
                  <div className="text-ink text-sm font-semibold mb-1.5">📅 Upcoming Hearing</div>
                  <div className="text-[13.5px] text-warning-strong">
                    {new Date(complaint.hearing_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {complaint.hearing_time && ` at ${complaint.hearing_time}`}
                  </div>
                </div>
              )}

              {complaint.respondent_name && (
                <div className="bg-surface border border-border rounded-2xl p-4.5 shadow-token-md">
                  <div className="text-ink text-sm font-semibold mb-2.5">👤 Respondent</div>
                  <div className="text-[13.5px] font-semibold text-ink">{complaint.respondent_name}</div>
                  {complaint.respondent_address && (
                    <div className="text-[13px] text-ink-faint mt-1">{complaint.respondent_address}</div>
                  )}
                </div>
              )}

              {complaint.description && (
                <div className="bg-surface border border-border rounded-2xl p-4.5 shadow-token-md">
                  <div className="text-ink text-sm font-semibold mb-2">📝 Description</div>
                  <div className="text-[13px] text-ink-soft leading-relaxed bg-surface-sunken border border-border rounded-md p-2.5">
                    {complaint.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}

export default TrackStatus