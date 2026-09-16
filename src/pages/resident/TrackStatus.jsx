import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'

const BADGES = {
  filed: { bg: 'bg-amber-500/15', text: 'text-amber-300', label: 'Filed' },
  summoned: { bg: 'bg-sky-500/15', text: 'text-sky-300', label: 'Summoned' },
  mediation: { bg: 'bg-blue-500/15', text: 'text-blue-300', label: 'Mediation' },
  pangkat_formed: { bg: 'bg-purple-500/15', text: 'text-purple-300', label: 'Pangkat Formed' },
  pangkat_hearing: { bg: 'bg-purple-500/15', text: 'text-purple-300', label: 'Pangkat Hearing' },
  settled: { bg: 'bg-green-500/15', text: 'text-green-300', label: 'Settled' },
  cfa_issued: { bg: 'bg-gray-400/15', text: 'text-gray-300', label: 'CFA Issued' },
  dismissed: { bg: 'bg-red-500/15', text: 'text-red-300', label: 'Dismissed' },
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
      <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 mb-5 max-w-[600px]">
        <div className="text-white text-[15px] font-semibold mb-1">Track Your Complaint</div>
        <div className="text-blue-200/50 text-[13px] mb-3.5">Enter your reference number to see the current status</div>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            placeholder="e.g. KP-2026-001"
            className="flex-1 min-w-0 bg-white/10 border border-white/20 text-white placeholder-blue-200/30 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          />
          <button type="submit" className="bg-blue-500/90 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg px-6 py-2.5 sm:py-0 border border-blue-400/30">
            Search
          </button>
        </form>
      </div>

      {!searched && (
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-8 md:p-12 text-center max-w-[500px]">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-white text-[15px] font-semibold mb-1.5">Enter a Reference Number</div>
          <div className="text-blue-200/50 text-[13.5px] mb-4">
            Your reference number was given after submitting a complaint. It looks like <strong className="text-white">KP-2026-001</strong>.
          </div>
          <Link to="/my-reports" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-lg px-5 py-2.5 text-sm font-semibold">
            View All My Reports
          </Link>
        </div>
      )}

      {searched && !loading && !complaint && (
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-8 md:p-12 text-center max-w-[500px]">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-white text-base font-semibold mb-1.5">Complaint Not Found</div>
          <div className="text-blue-200/50 text-[13.5px] mb-4">
            No complaint found with reference number <strong className="text-white">{refInput}</strong>. Make sure you entered the correct reference number.
          </div>
          <Link to="/my-reports" className="inline-flex items-center gap-2 bg-blue-500/90 hover:bg-blue-500 text-white rounded-lg px-5 py-2.5 text-sm font-semibold border border-blue-400/30">
            View My Reports
          </Link>
        </div>
      )}

      {complaint && (
        <>
          {/* Case Info */}
          <div className="bg-blue-900/50 backdrop-blur-xl border border-white/15 rounded-2xl px-5 md:px-6 py-5 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[11px] text-blue-200/50 uppercase tracking-wide mb-1">Reference Number</div>
              <div className="text-xl font-bold text-white font-mono">{complaint.reference_number}</div>
            </div>
            <div>
              <div className="text-[11px] text-blue-200/50 uppercase tracking-wide mb-1">Category</div>
              <div className="text-[15px] font-semibold text-white">{complaint.category}</div>
            </div>
            <div>
              <div className="text-[11px] text-blue-200/50 uppercase tracking-wide mb-1">Date Filed</div>
              <div className="text-[15px] font-semibold text-white">
                {new Date(complaint.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5 items-start">
            {/* Timeline */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 md:p-6 min-w-0">
              <div className="text-white text-[15px] font-semibold mb-5">Case Progress Timeline</div>

              {STEPS.map((step, i) => {
                const isDone = i < currentIdx
                const isActive = i === currentIdx
                const isFinal = step.key === 'outcome'
                return (
                  <div key={step.key} className="flex gap-3.5 pb-6 last:pb-0 relative">
                    {i < STEPS.length - 1 && (
                      <div className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-white/10" />
                    )}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10 ${
                        isFinal && isActive && complaint.status === 'dismissed'
                          ? 'bg-red-500/80 border-red-400'
                          : isDone
                          ? 'bg-blue-600 border-blue-500'
                          : isActive
                          ? 'bg-blue-500 border-blue-400'
                          : 'bg-white/5 border-white/20'
                      }`}
                    >
                      {isDone ? (
                        <span className="text-white text-xs">✓</span>
                      ) : isActive ? (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                      )}
                    </div>
                    <div className="flex-1 pt-0.5 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-sm font-semibold ${isDone || isActive ? 'text-white' : 'text-blue-200/40'}`}>
                          {isFinal && isActive ? (BADGES[complaint.status]?.label || step.label) : step.label}
                        </span>
                        {isActive && (
                          <span className="bg-blue-500/25 text-blue-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">Current</span>
                        )}
                      </div>
                      <div className={`text-[12.5px] leading-relaxed ${i > currentIdx ? 'text-blue-200/30' : 'text-blue-200/60'}`}>
                        {step.desc}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right Info */}
            <div className="flex flex-col gap-3.5 min-w-0">
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4.5 text-center">
                <div className="text-[12px] text-blue-200/50 uppercase tracking-wide mb-2">Current Stage</div>
                {(() => {
                  const b = BADGES[complaint.status] || BADGES.filed
                  return <span className={`${b.bg} ${b.text} px-5 py-2 rounded-full text-[15px] font-bold`}>{b.label}</span>
                })()}
              </div>

              {complaint.hearing_date && !isOutcome && (
                <div className="bg-amber-500/15 border border-amber-400/30 rounded-2xl p-4.5">
                  <div className="text-white text-sm font-semibold mb-1.5">📅 Upcoming Hearing</div>
                  <div className="text-[13.5px] text-amber-200">
                    {new Date(complaint.hearing_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {complaint.hearing_time && ` at ${complaint.hearing_time}`}
                  </div>
                </div>
              )}

              {complaint.respondent_name && (
                <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4.5">
                  <div className="text-white text-sm font-semibold mb-2.5">👤 Respondent</div>
                  <div className="text-[13.5px] font-semibold text-white">{complaint.respondent_name}</div>
                  {complaint.respondent_address && (
                    <div className="text-[13px] text-blue-200/50 mt-1">{complaint.respondent_address}</div>
                  )}
                </div>
              )}

              {complaint.description && (
                <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4.5">
                  <div className="text-white text-sm font-semibold mb-2">📝 Description</div>
                  <div className="text-[13px] text-blue-100/70 leading-relaxed bg-white/5 border border-white/10 rounded-md p-2.5">
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