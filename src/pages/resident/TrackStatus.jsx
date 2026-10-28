import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import {
  MdOutlineSend,
  MdOutlineBlock,
  MdOutlineSchedule,
  MdOutlineInbox,
  MdOutlineMarkEmailRead,
  MdOutlineHandshake,
  MdOutlineGroups,
  MdOutlineGavel,
  MdOutlineFlag,
  MdOutlineSearchOff,
  MdOutlinePerson,
  MdOutlineDescription,
  MdArrowBack,
  MdCheck,
  MdOutlineBalance,
  MdOutlineTaskAlt,
} from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'
import { Card, StatusBadge, EmptyState, Skeleton, LinkButton } from '../../components/ui'
import { HearingCard } from '../../components/cases'
import { STATUS } from '../../components/status'
import { formatDate, formatTime, upcomingHearings } from '../../lib/cases'

const BASE_STEPS = [
  { key: 'submitted', label: 'Complaint submitted', icon: MdOutlineSend, desc: 'Your complaint was sent to the barangay.' },
  { key: 'filed', label: 'Accepted and filed', icon: MdOutlineInbox, desc: 'The barangay accepted your complaint and officially filed it.' },
  { key: 'summoned', label: 'Summons issued', icon: MdOutlineMarkEmailRead, desc: 'The other party was summoned to appear at the barangay.' },
  { key: 'mediation', label: 'Mediation', icon: MdOutlineHandshake, desc: 'The Punong Barangay helps both sides reach an agreement (up to 15 days).' },
  { key: 'pangkat_formed', label: 'Pangkat formed', icon: MdOutlineGroups, desc: 'If mediation fails, a 3-member Pangkat ng Tagapagkasundo takes over.' },
  { key: 'pangkat_hearing', label: 'Conciliation', icon: MdOutlineGavel, desc: 'The Pangkat hears both sides to help them reach a settlement (15 to 30 days).' },
]
const ARBITRATION_STEP = { key: 'arbitration', label: 'Arbitration', icon: MdOutlineBalance, desc: 'Both sides agreed to let the arbitrator decide the dispute.' }
const OUTCOME_STEP = { key: 'outcome', label: 'Outcome', icon: MdOutlineFlag, desc: 'The case is settled, dismissed, or a Certificate to File Action is issued.' }
const CLOSED_STEP = { key: 'closed', label: 'Settlement completed', icon: MdOutlineTaskAlt, desc: 'The settlement is final and has been complied with.' }

const OUTCOMES = ['settled', 'cfa_issued', 'dismissed']
const SETTLEMENT_PATH = ['settled', 'execution', 'closed']

const CFA_TEXT = {
  repudiated: 'The settlement was repudiated. You may now bring this case to court or the proper government office using the Certificate to File Action.',
  no_settlement: 'No settlement was reached. You may now bring this case to court or the proper government office using the Certificate to File Action.',
  respondent_refused: 'The respondent refused to appear before the Pangkat. You may now bring this case to court or the proper government office using the Certificate to File Action.',
}

const DISMISS_TEXT = {
  complainant_failed_to_appear: 'The case was dismissed because the complainant did not appear without a valid reason. Filing this action in court may be barred.',
  withdrawn: 'The complaint was withdrawn.',
  not_covered: 'The case is not covered by the Katarungang Pambarangay and should be brought to the proper office.',
}

function buildSteps(c, stageDates) {
  const steps = [...BASE_STEPS]
  if (c.status === 'arbitration' || c.settlement_type === 'arbitration_award' || stageDates.arbitration) steps.push(ARBITRATION_STEP)
  steps.push(OUTCOME_STEP)
  if (SETTLEMENT_PATH.includes(c.status)) steps.push(CLOSED_STEP)
  return steps
}

function currentIndex(steps, status) {
  if (status === 'closed' || status === 'execution') return steps.length - 1
  if (OUTCOMES.includes(status)) return steps.findIndex((s) => s.key === 'outcome')
  return steps.findIndex((s) => s.key === status)
}

const longDate = (d) => formatDate(d, { month: 'long', day: 'numeric', year: 'numeric' })

function outcomeStep(c) {
  if (c.status === 'cfa_issued') return { label: 'Certificate to File Action', desc: CFA_TEXT[c.cfa_type] || CFA_TEXT.no_settlement }
  if (c.status === 'dismissed') return { label: 'Dismissed', desc: DISMISS_TEXT[c.dismissal_reason] || 'The case was dismissed by the barangay.' }
  const award = c.settlement_type === 'arbitration_award'
  const finalAt = c.settled_at ? new Date(new Date(c.settled_at).getTime() + 10 * 86400000) : null
  const pending = c.status === 'settled' && finalAt && finalAt > new Date()
  return {
    label: award ? 'Arbitration award' : 'Amicable settlement',
    desc: `${award ? 'The arbitrator issued an award.' : 'Both parties reached an amicable settlement.'}${
      finalAt ? (pending ? ` It becomes final on ${longDate(finalAt)} unless repudiated within 10 days.` : ` It became final on ${longDate(finalAt)}.`) : ''
    }`,
  }
}

function TrackStatus() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const ref = (searchParams.get('ref') || '').toUpperCase()
  const [result, setResult] = useState({ ref: null, complaint: null, stageDates: {} })

  useEffect(() => {
    if (!user || !ref) return
    let cancelled = false

    async function load() {
      const { data: complaint } = await supabase
        .from('complaints')
        .select('*')
        .eq('reference_number', ref)
        .eq('user_id', user.id)
        .maybeSingle()

      const stageDates = {}
      if (complaint) {
        stageDates.submitted = complaint.created_at
        stageDates.filed = complaint.reviewed_at
        const { data: logs } = await supabase
          .from('case_activity_log')
          .select('stage, created_at')
          .eq('complaint_id', complaint.id)
          .eq('entry_type', 'stage_change')
        for (const l of logs || []) {
          const key = OUTCOMES.includes(l.stage) ? 'outcome' : SETTLEMENT_PATH.includes(l.stage) ? 'closed' : l.stage
          if (!stageDates[key] || l.created_at > stageDates[key]) stageDates[key] = l.created_at
        }
      }
      if (!cancelled) setResult({ ref, complaint, stageDates })
    }
    load()

    return () => {
      cancelled = true
    }
  }, [user, ref])

  if (!ref) return <Navigate to="/my-reports" replace />

  const loading = result.ref !== ref
  const { complaint, stageDates } = result

  return (
    <AppLayout title="Case Details">
      <Link to="/my-reports" className="inline-flex items-center gap-1.5 text-accent text-sm font-semibold mb-4">
        <MdArrowBack aria-hidden="true" /> My Cases
      </Link>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          <Skeleton className="h-[420px] w-full rounded-2xl" />
          <Skeleton className="h-[220px] w-full rounded-2xl" />
        </div>
      ) : !complaint ? (
        <Card className="max-w-[640px]">
          <EmptyState
            icon={MdOutlineSearchOff}
            title="Case not found"
            message={`We couldn't find a complaint with reference number ${ref} on your account.`}
            action={<LinkButton to="/my-reports">Go to My Cases</LinkButton>}
          />
        </Card>
      ) : (
        <CaseView complaint={complaint} stageDates={stageDates} />
      )}
    </AppLayout>
  )
}

function CaseView({ complaint, stageDates }) {
  const STEPS = buildSteps(complaint, stageDates)
  const currentIdx = currentIndex(STEPS, complaint.status)
  const outcome = outcomeStep(complaint)
  const isDeclined = complaint.status === 'declined'
  const hearing = upcomingHearings([complaint])[0]

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h2 className="text-ink text-xl md:text-2xl font-bold">{complaint.category}</h2>
          <div className="text-ink-faint text-sm mt-0.5">
            <span className="font-mono">{complaint.reference_number}</span> · Filed {formatDate(complaint.created_at, { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <div className="flex-shrink-0">
          <StatusBadge status={complaint.status} size="lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="flex flex-col gap-5 min-w-0">
          {hearing && <HearingCard complaint={hearing} showLink={false} />}

          {complaint.status === 'submitted' && (
            <div className="flex gap-3 bg-warning-soft border border-warning-strong/25 rounded-2xl p-4 text-warning-strong">
              <MdOutlineSchedule className="text-2xl flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm leading-relaxed">
                <div className="font-bold text-base">Next step: visit the Barangay Hall</div>
                Please appear in person within 24 hours of filing (8AM–5PM, Monday to Friday) so the barangay can review and accept your complaint.
              </div>
            </div>
          )}

          {isDeclined ? (
            <Card className="p-5 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-danger-soft text-danger-strong flex items-center justify-center flex-shrink-0">
                  <MdOutlineBlock className="text-2xl" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-ink text-lg font-bold">Your complaint was not accepted</div>
                  {complaint.reviewed_at && (
                    <div className="text-ink-faint text-sm">Reviewed on {formatDate(complaint.reviewed_at, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                  )}
                </div>
              </div>
              <div className="text-xs text-ink-faint uppercase tracking-wide mb-1.5">Reason</div>
              <div className="text-ink text-sm leading-relaxed bg-danger-soft border border-danger-strong/20 rounded-lg p-3.5 mb-5">
                {complaint.declined_reason || 'No reason was recorded.'}
              </div>
              <div className="text-ink text-sm font-semibold mb-1.5">What you can do</div>
              <ul className="text-ink-soft text-sm leading-relaxed list-disc pl-5 mb-5 space-y-1">
                <li>Visit the Barangay Hall (8AM–5PM, Monday to Friday) to ask about the decision.</li>
                <li>If the reason can be fixed, file a new complaint with the correct information.</li>
              </ul>
              <LinkButton to="/complaints/new">File a New Complaint</LinkButton>
            </Card>
          ) : (
            <Card className="p-5 md:p-6">
              <div className="text-ink text-base font-semibold mb-5">Case progress</div>
              <ol className="stagger">
                {STEPS.map((step, i) => {
                  const isDone = i < currentIdx
                  const isActive = i === currentIdx
                  const isOutcome = step.key === 'outcome'
                  const isFinal = isOutcome || step.key === 'closed'
                  const reachedOutcome = isOutcome && (isDone || isActive)
                  const execution = step.key === 'closed' && complaint.status === 'execution'
                  const Icon = reachedOutcome ? STATUS[complaint.status]?.icon || step.icon : execution ? STATUS.execution.icon : step.icon
                  const label = reachedOutcome ? outcome.label : execution ? 'Execution' : step.label
                  const desc = reachedOutcome
                    ? outcome.desc
                    : execution
                      ? 'The settlement was not complied with. The barangay is enforcing it through execution.'
                      : step.desc
                  const date = (isDone || isActive) && stageDates[step.key]
                  const circle =
                    isOutcome && isActive && complaint.status === 'dismissed'
                      ? 'bg-red-600 text-white'
                      : isDone || isActive
                        ? 'bg-accent text-accent-ink'
                        : 'bg-surface-sunken text-ink-faint border border-border'

                  return (
                    <li key={step.key} className="flex gap-4 pb-6 last:pb-0 relative" aria-current={isActive ? 'step' : undefined}>
                      {i < STEPS.length - 1 && (
                        <div className={`absolute left-[19px] top-10 bottom-0 w-0.5 ${isDone ? 'bg-accent' : 'bg-border'}`} />
                      )}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${circle} ${isActive ? 'ring-4 ring-accent/20' : ''}`}>
                        {isDone ? <MdCheck className="text-xl" aria-hidden="true" /> : <Icon className="text-xl" aria-hidden="true" />}
                      </div>
                      <div className="flex-1 pt-1.5 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className={`text-base font-semibold ${isDone || isActive ? 'text-ink' : 'text-ink-faint'}`}>{label}</span>
                          {isActive && !isFinal && complaint.status !== 'closed' && (
                            <span className="bg-accent-soft text-accent px-2.5 py-0.5 rounded-full text-xs font-semibold">You are here</span>
                          )}
                        </div>
                        {date && <div className="text-ink-faint text-xs mb-1">{formatDate(date, { month: 'long', day: 'numeric', year: 'numeric' })}</div>}
                        <div className={`text-sm leading-relaxed ${i > currentIdx ? 'text-ink-faint' : 'text-ink-soft'}`}>{desc}</div>
                        {reachedOutcome && SETTLEMENT_PATH.includes(complaint.status) && complaint.settlement_terms && (
                          <div className="mt-2 text-sm text-ink bg-success-soft border border-success-strong/20 rounded-lg p-3 leading-relaxed">
                            <span className="font-semibold">Agreement: </span>
                            {complaint.settlement_terms}
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          {complaint.respondent_name && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2.5">
                <MdOutlinePerson className="text-xl text-accent" aria-hidden="true" />
                <div className="text-ink text-base font-semibold">Complaint against</div>
              </div>
              <div className="text-sm font-semibold text-ink">{complaint.respondent_name}</div>
              {complaint.respondent_address && <div className="text-sm text-ink-faint mt-1">{complaint.respondent_address}</div>}
            </Card>
          )}

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <MdOutlineDescription className="text-xl text-accent" aria-hidden="true" />
              <div className="text-ink text-base font-semibold">What happened</div>
            </div>
            {(complaint.incident_date || complaint.location) && (
              <div className="text-sm text-ink-soft mb-3 space-y-0.5">
                {complaint.incident_date && (
                  <div>
                    {formatDate(complaint.incident_date, { month: 'long', day: 'numeric', year: 'numeric' })}
                    {complaint.incident_time && ` at ${formatTime(complaint.incident_time)}`}
                  </div>
                )}
                {complaint.location && <div>{complaint.location}</div>}
              </div>
            )}
            <div className="text-sm text-ink-soft leading-relaxed bg-surface-sunken border border-border rounded-lg p-3 whitespace-pre-line">
              {complaint.description}
            </div>
            {complaint.relief_requested && (
              <div className="text-sm text-ink-soft mt-3">
                <span className="font-semibold text-ink">You asked for: </span>
                {complaint.relief_requested}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}

export default TrackStatus
