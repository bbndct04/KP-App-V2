import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  MdOutlineInbox,
  MdOutlineMarkEmailRead,
  MdOutlineHandshake,
  MdOutlineGroups,
  MdOutlineGavel,
  MdOutlineFlag,
  MdOutlineManageSearch,
  MdOutlineSearchOff,
  MdOutlineEvent,
  MdOutlinePerson,
  MdOutlineDescription,
  MdCheck,
  MdSearch,
} from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'
import { Card, StatusBadge, EmptyState, Skeleton, Button, Input, LinkButton } from '../../components/ui'
import { STATUS } from '../../components/status'

const STEPS = [
  { key: 'filed', label: 'Complaint Filed', icon: MdOutlineInbox, desc: 'Your complaint has been received by the Barangay.' },
  { key: 'summoned', label: 'Summons Issued', icon: MdOutlineMarkEmailRead, desc: 'The respondent has been summoned to appear.' },
  { key: 'mediation', label: 'Mediation', icon: MdOutlineHandshake, desc: 'The Punong Barangay is mediating between both parties.' },
  { key: 'pangkat_formed', label: 'Pangkat Formed', icon: MdOutlineGroups, desc: 'A 3-member Pangkat has been formed to continue conciliation.' },
  { key: 'pangkat_hearing', label: 'Pangkat Hearing', icon: MdOutlineGavel, desc: 'The Pangkat is hearing both parties to reach a settlement.' },
  { key: 'outcome', label: 'Final Outcome', icon: MdOutlineFlag, desc: 'The case has reached a final outcome.' },
]

const OUTCOME_STAGES = ['settled', 'cfa_issued', 'dismissed']

function currentIndex(status) {
  if (OUTCOME_STAGES.includes(status)) return 5
  return STEPS.findIndex((s) => s.key === status)
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h, 10)
  return `${hour % 12 === 0 ? 12 : hour % 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`
}

function TrackStatus() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const refParam = searchParams.get('ref') || ''
  const [refInput, setRefInput] = useState(refParam)
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || !refParam) return
    let cancelled = false

    async function runSearch() {
      setLoading(true)
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .eq('reference_number', refParam)
        .eq('user_id', user.id)
        .maybeSingle()
      if (cancelled) return
      setComplaint(data || null)
      setLoading(false)
    }
    runSearch()

    return () => {
      cancelled = true
    }
  }, [user, refParam])

  function handleSubmit(e) {
    e.preventDefault()
    const ref = refInput.trim().toUpperCase()
    if (ref) setSearchParams({ ref })
  }

  const currentIdx = complaint ? currentIndex(complaint.status) : -1
  const isOutcome = complaint && OUTCOME_STAGES.includes(complaint.status)

  return (
    <AppLayout title="Track Status">
      <Card className="p-5 mb-5 max-w-[640px]">
        <div className="flex items-center gap-2.5 mb-1">
          <MdOutlineManageSearch className="text-2xl text-accent" aria-hidden="true" />
          <div className="text-ink text-base font-semibold">Track Your Complaint</div>
        </div>
        <div className="text-ink-faint text-sm mb-4">Enter your reference number to see the current status</div>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <Input
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            placeholder="e.g. KP-2026-001"
            aria-label="Reference number"
            className="flex-1 min-w-0"
          />
          <Button type="submit" icon={MdSearch} disabled={!refInput.trim()}>
            Search
          </Button>
        </form>
      </Card>

      {!refParam && (
        <Card className="max-w-[640px]">
          <EmptyState
            icon={MdOutlineManageSearch}
            title="Enter a reference number"
            message="You received a reference number after submitting a complaint. It looks like KP-2026-001."
            action={
              <LinkButton to="/my-reports" variant="secondary">
                View All My Reports
              </LinkButton>
            }
          />
        </Card>
      )}

      {refParam && loading && (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5">
          <Skeleton className="h-[420px] w-full rounded-2xl" />
          <Skeleton className="h-[220px] w-full rounded-2xl" />
        </div>
      )}

      {refParam && !loading && !complaint && (
        <Card className="max-w-[640px]">
          <EmptyState
            icon={MdOutlineSearchOff}
            title="Complaint not found"
            message={`No complaint found with reference number ${refParam}. Make sure you entered it correctly.`}
            action={<LinkButton to="/my-reports">View My Reports</LinkButton>}
          />
        </Card>
      )}

      {refParam && !loading && complaint && (
        <>
          <div className="bg-accent-soft border border-accent/20 rounded-2xl px-5 md:px-6 py-5 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-ink-faint uppercase tracking-wide mb-1">Reference Number</div>
              <div className="text-xl font-bold text-ink font-mono">{complaint.reference_number}</div>
            </div>
            <div>
              <div className="text-xs text-ink-faint uppercase tracking-wide mb-1">Category</div>
              <div className="text-base font-semibold text-ink">{complaint.category}</div>
            </div>
            <div>
              <div className="text-xs text-ink-faint uppercase tracking-wide mb-1">Date Filed</div>
              <div className="text-base font-semibold text-ink">
                {new Date(complaint.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5 items-start">
            <Card className="p-5 md:p-6 min-w-0">
              <div className="text-ink text-base font-semibold mb-5">Case Progress</div>

              {STEPS.map((step, i) => {
                const isDone = i < currentIdx
                const isActive = i === currentIdx
                const isFinal = step.key === 'outcome'
                const Icon = isFinal && isActive ? STATUS[complaint.status]?.icon || step.icon : step.icon
                const label = isFinal && isActive ? STATUS[complaint.status]?.label || step.label : step.label
                const dismissed = isFinal && isActive && complaint.status === 'dismissed'

                const circle = dismissed
                  ? 'bg-red-600 text-white'
                  : isDone || isActive
                  ? 'bg-accent text-accent-ink'
                  : 'bg-surface-sunken text-ink-faint border border-border'

                return (
                  <div key={step.key} className="flex gap-4 pb-6 last:pb-0 relative">
                    {i < STEPS.length - 1 && (
                      <div className={`absolute left-[19px] top-10 bottom-0 w-0.5 ${isDone ? 'bg-accent' : 'bg-border'}`} />
                    )}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${circle} ${isActive ? 'ring-4 ring-accent/20' : ''}`}>
                      {isDone ? <MdCheck className="text-xl" aria-hidden="true" /> : <Icon className="text-xl" aria-hidden="true" />}
                    </div>
                    <div className="flex-1 pt-1.5 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-base font-semibold ${isDone || isActive ? 'text-ink' : 'text-ink-faint'}`}>{label}</span>
                        {isActive && <span className="bg-accent-soft text-accent px-2.5 py-0.5 rounded-full text-xs font-semibold">Current</span>}
                      </div>
                      <div className={`text-sm leading-relaxed ${i > currentIdx ? 'text-ink-faint' : 'text-ink-soft'}`}>{step.desc}</div>
                    </div>
                  </div>
                )
              })}
            </Card>

            <div className="flex flex-col gap-4 min-w-0">
              <Card className="p-5 text-center">
                <div className="text-xs text-ink-faint uppercase tracking-wide mb-3">Current Stage</div>
                <StatusBadge status={complaint.status} size="lg" />
              </Card>

              {complaint.hearing_date && !isOutcome && (
                <div className="bg-warning-soft border border-warning-strong/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-1.5 text-warning-strong">
                    <MdOutlineEvent className="text-xl" aria-hidden="true" />
                    <div className="text-base font-semibold">Upcoming Hearing</div>
                  </div>
                  <div className="text-sm text-warning-strong">
                    {new Date(complaint.hearing_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    {complaint.hearing_time && ` at ${formatTime(complaint.hearing_time)}`}
                  </div>
                </div>
              )}

              {complaint.respondent_name && (
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <MdOutlinePerson className="text-xl text-accent" aria-hidden="true" />
                    <div className="text-ink text-base font-semibold">Respondent</div>
                  </div>
                  <div className="text-sm font-semibold text-ink">{complaint.respondent_name}</div>
                  {complaint.respondent_address && <div className="text-sm text-ink-faint mt-1">{complaint.respondent_address}</div>}
                </Card>
              )}

              {complaint.description && (
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <MdOutlineDescription className="text-xl text-accent" aria-hidden="true" />
                    <div className="text-ink text-base font-semibold">Description</div>
                  </div>
                  <div className="text-sm text-ink-soft leading-relaxed bg-surface-sunken border border-border rounded-lg p-3">
                    {complaint.description}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}

export default TrackStatus
