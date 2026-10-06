import { useEffect, useState } from 'react'
import {
  MdOutlineReport,
  MdOutlineEvent,
  MdOutlineLocationOn,
  MdOutlineAttachFile,
  MdOutlineImageNotSupported,
  MdOutlineZoomIn,
  MdOutlineOpenInNew,
} from 'react-icons/md'
import { Card, CardHeader, Skeleton } from '../ui'
import { signedUrl } from '../../lib/storage'
import Lightbox from './Lightbox'

const IMAGE_RE = /\.(png|jpe?g|webp|gif)$/i

function formatDate(d) {
  if (!d) return null
  return new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTime(t) {
  if (!t) return null
  const [h, m] = t.split(':')
  const hour = parseInt(h, 10)
  return `${hour % 12 === 0 ? 12 : hour % 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`
}

function Detail({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-2.5">
      <Icon className="text-xl text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0">
        <div className="text-xs text-ink-faint uppercase tracking-wide mb-0.5">{label}</div>
        <div className="text-ink text-sm">{children}</div>
      </div>
    </div>
  )
}

function ComplaintDetails({ complaint, className = '' }) {
  const path = complaint.attachment_url
  const [evidence, setEvidence] = useState({ path: null, url: null })
  const [zoom, setZoom] = useState(false)

  useEffect(() => {
    if (!path) return
    let cancelled = false
    signedUrl('complaint-attachments', path).then((url) => {
      if (!cancelled) setEvidence({ path, url })
    })
    return () => {
      cancelled = true
    }
  }, [path])

  const loaded = evidence.path === path
  const url = loaded ? evidence.url : null
  const isImage = path && IMAGE_RE.test(path)
  const when = [formatDate(complaint.incident_date), formatTime(complaint.incident_time)].filter(Boolean).join(' at ')

  return (
    <Card className={className}>
      <CardHeader icon={MdOutlineReport} title="Complaint details" subtitle={complaint.category} />
      <div className="p-5 flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Detail icon={MdOutlineEvent} label="When it happened">
            {when || '—'}
          </Detail>
          <Detail icon={MdOutlineLocationOn} label="Where it happened">
            {complaint.location || '—'}
          </Detail>
        </div>

        <div>
          <div className="text-xs text-ink-faint uppercase tracking-wide mb-1.5">What happened</div>
          <div className="text-ink text-sm leading-relaxed whitespace-pre-wrap">{complaint.description || '—'}</div>
        </div>

        <div className="bg-accent-soft border border-accent/20 rounded-xl p-4">
          <div className="text-xs text-accent uppercase tracking-wide font-semibold mb-1.5">Relief requested by the complainant</div>
          <div className="text-ink text-sm leading-relaxed whitespace-pre-wrap">{complaint.relief_requested || '—'}</div>
        </div>

        <div>
          <div className="text-xs text-ink-faint uppercase tracking-wide mb-2">Evidence</div>
          {!path ? (
            <div className="text-ink-faint text-sm flex items-center gap-2">
              <MdOutlineAttachFile className="text-lg" aria-hidden="true" /> No evidence attached
            </div>
          ) : !loaded ? (
            <Skeleton className="h-28 w-48" />
          ) : !url ? (
            <div className="text-warning-strong text-sm flex items-center gap-2">
              <MdOutlineImageNotSupported className="text-lg" aria-hidden="true" /> The evidence file could not be opened.
            </div>
          ) : isImage ? (
            <button
              onClick={() => setZoom(true)}
              aria-label="View evidence full size"
              className="relative block rounded-xl overflow-hidden border border-border bg-surface-sunken group"
            >
              <img src={url} alt="Evidence attached by the complainant" className="max-h-56 object-contain" />
              <span className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-1.5">
                <MdOutlineZoomIn className="text-lg" aria-hidden="true" />
              </span>
            </button>
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent text-sm font-semibold border border-border rounded-lg px-4 h-11 hover:bg-surface-hover"
            >
              <MdOutlineOpenInNew className="text-lg" aria-hidden="true" /> Open attached file
            </a>
          )}
        </div>
      </div>
      {zoom && url && <Lightbox src={url} alt="Evidence attached by the complainant" onClose={() => setZoom(false)} />}
    </Card>
  )
}

export default ComplaintDetails
