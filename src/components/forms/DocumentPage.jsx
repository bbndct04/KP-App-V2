import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  MdArrowBack,
  MdOutlinePrint,
  MdOutlineEditNote,
  MdOutlineSave,
  MdOutlineVerified,
  MdOutlineLock,
  MdOutlineInfo,
  MdOutlineHistory,
  MdOutlineBlock,
} from 'react-icons/md'
import { DocContext } from '../../context/docContext'
import { useCaseDocument } from '../../hooks/useCaseDocument'
import { PAPER, MARGIN_PX } from '../../lib/formsKit'
import { Button, Select, Textarea, ConfirmDialog } from '../ui'
import { FormSkeleton } from '../../pages/admin/forms/FormShell'
import { FORM_CSS } from './formStyles'

function useFitScale(paperWidth, ready) {
  const wrap = useRef(null)
  const inner = useRef(null)
  const [m, setM] = useState({ scale: 1, height: 0 })

  useEffect(() => {
    if (!ready || !wrap.current || !inner.current) return
    const measure = () => {
      if (!wrap.current || !inner.current) return
      setM({ scale: Math.min(1, wrap.current.clientWidth / paperWidth), height: inner.current.offsetHeight })
    }
    const ro = new ResizeObserver(measure)
    ro.observe(wrap.current)
    ro.observe(inner.current)
    return () => ro.disconnect()
  }, [paperWidth, ready])

  return [wrap, inner, m.scale, m.height]
}

function longDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })
}

function VoidDialog({ open, busy, onCancel, onSubmit }) {
  const [reason, setReason] = useState('')
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-5 kp-noprint" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="void-title"
        className="bg-surface border border-border rounded-2xl p-6 max-w-[460px] w-full shadow-token-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-xl bg-danger-soft text-danger-strong flex items-center justify-center flex-shrink-0">
            <MdOutlineBlock className="text-2xl" aria-hidden="true" />
          </div>
          <div>
            <div id="void-title" className="text-ink text-lg font-bold mb-1">Void this form and start a new version?</div>
            <div className="text-ink-soft text-sm leading-relaxed">
              The issued copy is kept as history, marked void. A new draft opens so you can correct it and issue it again. Collect and cancel the old paper copy.
            </div>
          </div>
        </div>
        <label className="block text-sm font-semibold text-ink-soft mb-1.5">Reason *</label>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="For example: wrong hearing date" className="mb-5" />
        <div className="flex gap-2.5 justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => onSubmit(reason.trim())} disabled={!reason.trim() || busy}>
            {busy ? 'Please wait...' : 'Void and start new version'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function DocumentPage({ formNo, title, makeDefaults, Body }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const doc = useCaseDocument(formNo, title, makeDefaults)
  const [edit, setEdit] = useState(false)
  const [paperKey, setPaperKey] = useState(() => localStorage.getItem('kp-paper') || 'legal')
  const [confirmIssue, setConfirmIssue] = useState(false)
  const [voidOpen, setVoidOpen] = useState(false)
  const paper = PAPER[paperKey] || PAPER.legal
  const [wrapRef, innerRef, scale, paperHeight] = useFitScale(paper.w, doc.ready && !!doc.complaint)

  const reference = doc.complaint?.reference_number
  useEffect(() => {
    if (!reference) return
    const previous = document.title
    document.title = `Form ${formNo} - ${reference}`
    return () => {
      document.title = previous
    }
  }, [reference, formNo])

  if (!doc.ready) return <FormSkeleton />
  if (!doc.complaint) return <div className="p-10 text-center">Complaint not found.</div>

  const canEdit = doc.status === 'new' || doc.status === 'draft'
  const editing = edit && canEdit
  const isIssued = doc.status === 'issued'

  function changePaper(value) {
    setPaperKey(value)
    localStorage.setItem('kp-paper', value)
  }

  function print() {
    setEdit(false)
    setTimeout(() => window.print(), 150)
  }

  async function onConfirmIssue() {
    const ok = await doc.issue()
    setConfirmIssue(false)
    setEdit(false)
    if (ok) setTimeout(() => window.print(), 400)
  }

  async function onVoid(reason) {
    const ok = await doc.voidAndReissue(reason)
    setVoidOpen(false)
    if (ok) setEdit(true)
  }

  const chip = isIssued
    ? { text: `Issued ${longDate(doc.active.issued_at)}`, cls: 'bg-success-soft text-success-strong' }
    : doc.status === 'draft'
    ? { text: 'Draft', cls: 'bg-warning-soft text-warning-strong' }
    : { text: 'New, not saved yet', cls: 'bg-surface-sunken text-ink-soft' }

  const saveNote = doc.dirty ? 'Unsaved changes' : doc.status === 'draft' ? 'All changes saved' : ''

  return (
    <DocContext.Provider value={{ fields: doc.fields, set: doc.set, edit: editing }}>
      <style>{`${FORM_CSS}@page{size:${paper.css};margin:1in}`}</style>
      <div className="kp-page-bg min-h-screen bg-bg py-5 px-3 sm:px-5">
        <div className="kp-noprint max-w-[1000px] mx-auto mb-4">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <Button variant="ghost" size="sm" icon={MdArrowBack} onClick={() => navigate(`/admin/cases/${id}`)}>
              Back to case
            </Button>
            <div className="text-ink text-base font-bold">
              Form {formNo}: {title}
              {doc.active?.version > 1 && <span className="text-ink-faint font-normal"> · version {doc.active.version}</span>}
            </div>
            <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${chip.cls}`}>{chip.text}</span>
            {saveNote && <span className={`text-xs ${doc.dirty ? 'text-warning-strong font-semibold' : 'text-ink-faint'}`}>{saveNote}</span>}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={paperKey} onChange={(e) => changePaper(e.target.value)} aria-label="Paper size" className="w-auto min-w-[170px] py-2">
              {Object.entries(PAPER).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.label}
                </option>
              ))}
            </Select>
            <div className="flex-1" />
            {canEdit && (
              <>
                <Button variant="secondary" icon={MdOutlineEditNote} aria-pressed={editing} onClick={() => setEdit((e) => !e)}>
                  {editing ? 'Edit mode: on' : 'Edit mode: off'}
                </Button>
                <Button variant="secondary" icon={MdOutlineSave} onClick={doc.saveDraft} disabled={doc.busy || (!doc.dirty && doc.status === 'draft')}>
                  Save draft
                </Button>
                <Button variant="secondary" icon={MdOutlinePrint} onClick={print}>
                  Print draft
                </Button>
                <Button icon={MdOutlineVerified} onClick={() => setConfirmIssue(true)} disabled={doc.busy}>
                  Issue and print
                </Button>
              </>
            )}
            {isIssued && (
              <>
                <Button variant="dangerOutline" icon={MdOutlineBlock} onClick={() => setVoidOpen(true)} disabled={doc.busy}>
                  Void and reissue
                </Button>
                <Button icon={MdOutlinePrint} onClick={print}>
                  Print
                </Button>
              </>
            )}
          </div>

          {isIssued ? (
            <div className="mt-3 bg-success-soft border border-success-strong/20 text-success-strong text-sm rounded-xl px-4 py-3 flex gap-2.5 leading-relaxed">
              <MdOutlineLock className="text-xl flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                Issued on {longDate(doc.active.issued_at)} by {doc.active.issued_by_name || 'a barangay admin'}. This copy is locked. If there is a mistake, use Void and reissue.
              </div>
            </div>
          ) : (
            <div className="mt-3 bg-info-soft border border-info-strong/20 text-info-strong text-sm rounded-xl px-4 py-3 flex gap-2.5 leading-relaxed">
              <MdOutlineInfo className="text-xl flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                This is a draft and is not official until you issue it. Turn on Edit mode to change names, dates, and wording. Drafts print with a DRAFT mark.
              </div>
            </div>
          )}
        </div>

        <div ref={wrapRef} className="kp-fit-wrap max-w-[1000px] mx-auto" style={{ height: paperHeight ? paperHeight * scale : undefined }}>
          <div ref={innerRef} className="kp-fit" style={{ width: paper.w, transform: `scale(${scale})`, transformOrigin: 'top left', margin: scale < 1 ? 0 : '0 auto' }}>
            <div className="kp-paper border border-black/20" style={{ padding: MARGIN_PX, minHeight: paper.h }}>
              {!isIssued && <div className="kp-watermark" aria-hidden="true">DRAFT</div>}
              <Body />
            </div>
          </div>
        </div>

        {doc.docs.length > 0 && (
          <div className="kp-noprint max-w-[1000px] mx-auto mt-6 bg-surface border border-border rounded-2xl p-5">
            <div className="text-ink text-base font-semibold mb-3 flex items-center gap-2">
              <MdOutlineHistory className="text-xl text-accent" aria-hidden="true" /> Version history
            </div>
            <ul className="divide-y divide-border">
              {doc.docs.map((d) => (
                <li key={d.id} className="py-2.5 text-sm">
                  <span className="font-semibold text-ink">Version {d.version}</span>
                  <span className="text-ink-soft">
                    {' · '}
                    {d.status === 'issued' && `Issued ${longDate(d.issued_at)} by ${d.issued_by_name || 'a barangay admin'}`}
                    {d.status === 'draft' && `Draft, last saved ${longDate(d.updated_at)}`}
                    {d.status === 'void' && `Void on ${longDate(d.voided_at)} by ${d.voided_by_name || 'a barangay admin'}`}
                  </span>
                  {d.status === 'void' && <div className="text-ink-faint">Reason: {d.void_reason}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmIssue}
        tone="primary"
        title={`Issue Form ${formNo}?`}
        message="This locks the form, dates it today, and records it in the case log. Then print it and sign it on paper."
        confirmLabel="Issue and print"
        loading={doc.busy}
        onConfirm={onConfirmIssue}
        onCancel={() => setConfirmIssue(false)}
      />
      <VoidDialog open={voidOpen} busy={doc.busy} onCancel={() => setVoidOpen(false)} onSubmit={onVoid} />
    </DocContext.Provider>
  )
}

export default DocumentPage
