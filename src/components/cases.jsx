import { Link } from 'react-router-dom'
import { MdOutlineEvent, MdOutlineSchedule, MdOutlinePlace, MdArrowForward, MdOutlineTimer } from 'react-icons/md'
import { StatusBadge } from './ui'
import { STATUS } from './status'
import { parseDate, formatDate, formatTime, relativeDay, progressOf } from '../lib/cases'

export function HearingCard({ complaint, showLink = true }) {
  const date = parseDate(complaint.hearing_date)
  return (
    <div className="bg-accent text-accent-ink rounded-2xl p-5 md:p-6 shadow-token-md">
      <div className="flex items-center gap-2 text-sm font-semibold opacity-90 mb-4">
        <MdOutlineEvent className="text-lg" aria-hidden="true" />
        Your next hearing
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-white/15 rounded-xl w-[72px] py-2 text-center flex-shrink-0">
          <div className="text-xs font-bold uppercase tracking-wide opacity-90">
            {date.toLocaleDateString('en-US', { month: 'short' })}
          </div>
          <div className="text-3xl font-bold leading-tight">{date.getDate()}</div>
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold">{relativeDay(complaint.hearing_date)}</div>
          <div className="text-sm opacity-90 flex items-center gap-1.5 mt-0.5">
            <MdOutlineSchedule aria-hidden="true" />
            {complaint.hearing_time ? formatTime(complaint.hearing_time) : 'Time to be announced'}
          </div>
          <div className="text-sm opacity-90 flex items-center gap-1.5 mt-0.5">
            <MdOutlinePlace aria-hidden="true" />
            Barangay Hall, New Kababae
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/20 text-sm">
        <div className="font-semibold">
          {complaint.category} · <span className="font-mono">{complaint.reference_number}</span>
        </div>
        <div className="opacity-90 mt-1">Bring a valid ID and any evidence. Please arrive 15 minutes early.</div>
      </div>
      {showLink && (
        <Link
          to={`/track?ref=${complaint.reference_number}`}
          className="mt-4 h-11 rounded-lg bg-white text-[#0b1f4d] text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-white/90 transition-colors"
        >
          View case <MdArrowForward aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

export function CaseRow({ complaint, to }) {
  const { step, total, pct } = progressOf(complaint.status)
  const closed = ['closed', 'cfa_issued', 'dismissed', 'declined'].includes(complaint.status)
  return (
    <Link to={to} className="block px-5 py-4 hover:bg-surface-hover active:bg-surface-hover transition-colors">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <div className="text-ink text-base font-semibold truncate">{complaint.category}</div>
          <div className="text-ink-faint text-xs font-mono">{complaint.reference_number}</div>
        </div>
        <StatusBadge status={complaint.status} />
      </div>
      {!closed && (
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full grow-x" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-ink-faint text-xs whitespace-nowrap">
            Step {step} of {total}
          </span>
        </div>
      )}
      <div className="text-sm mt-2 flex items-center justify-between gap-3">
        <span className="text-ink-soft">{STATUS[complaint.status]?.hint}</span>
        <span className="text-ink-faint text-xs flex items-center gap-1.5 flex-shrink-0">
          <span className="hidden sm:inline">Filed {formatDate(complaint.created_at)}</span>
          <MdArrowForward className="text-accent text-base" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

const TONES = {
  neutral: 'bg-surface-sunken text-ink-soft',
  warning: 'bg-warning-soft text-warning-strong',
  danger: 'bg-danger-soft text-danger-strong',
}

export function DeadlineBadge({ deadline }) {
  if (!deadline) return null
  return (
    <span className={`inline-flex items-center gap-1 rounded-full text-xs font-semibold px-2.5 py-1 whitespace-nowrap ${TONES[deadline.tone]}`}>
      <MdOutlineTimer className="text-[1.15em]" aria-hidden="true" />
      {deadline.label}
    </span>
  )
}
