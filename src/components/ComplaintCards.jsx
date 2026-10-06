import { Link } from 'react-router-dom'
import { MdArrowForward } from 'react-icons/md'
import { StatusBadge } from './ui'

function ComplaintCards({ complaints, linkFor, linkLabel = 'Track', showResident = false }) {
  return (
    <ul className="sm:hidden divide-y divide-border">
      {complaints.map((c) => (
        <li key={c.id}>
          <Link to={linkFor(c)} className="block px-5 py-4 active:bg-surface-hover transition-colors">
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-accent font-mono text-sm font-semibold">{c.reference_number}</span>
              <StatusBadge status={c.status} />
            </div>
            {showResident && <div className="text-ink text-sm font-medium mb-0.5">{c.profiles?.full_name || '—'}</div>}
            <div className="text-ink-soft text-sm mb-2.5">{c.category}</div>
            <div className="flex items-center justify-between">
              <span className="text-ink-faint text-xs">
                {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
              </span>
              <span className="text-accent text-sm font-semibold flex items-center gap-1">
                {linkLabel} <MdArrowForward aria-hidden="true" />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default ComplaintCards
