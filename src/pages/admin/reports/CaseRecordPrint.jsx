import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MdOutlineInfo } from 'react-icons/md'
import PrintShell from '../../../components/forms/PrintShell'
import { OfficeHeader } from '../../../components/forms/blocks'
import { FormSkeleton } from '../forms/FormShell'
import { supabase } from '../../../lib/supabaseClient'
import { dateParts, manilaDate } from '../../../lib/formsKit'
import { formatTime } from '../../../lib/cases'
import { filedAt, loadOffice, longDate, OPEN_STAGES, settlementMethod, stageLabel } from '../../../lib/reports'
import { CFA_TYPES, DISMISSAL_REASONS } from '../../../lib/outcomes'

const METHOD = { mediation: 'mediation before the Punong Barangay', conciliation: 'conciliation before the Pangkat ng Tagapagkasundo', arbitration: 'arbitration' }

function lastLog(logs, stage) {
  return [...logs].reverse().find((l) => l.stage === stage)?.created_at
}

function statusSentence(c, logs) {
  if (c.status === 'declined') {
    return `The complaint was received on ${longDate(c.created_at)} but was not docketed for the following reason: ${c.declined_reason || 'not stated'}.`
  }
  if (['settled', 'execution', 'closed'].includes(c.status)) {
    const settled = c.settled_at || lastLog(logs, 'settled')
    const how =
      c.settlement_type === 'arbitration_award'
        ? `An arbitration award was rendered on ${longDate(settled)}`
        : `The parties entered into an amicable settlement through ${METHOD[settlementMethod(c, logs)]} on ${longDate(settled)}`
    if (c.status === 'closed') return `${how}, and the terms of the settlement have been complied with.`
    if (c.status === 'execution') return `${how}. The settlement is presently under execution.`
    return `${how}.`
  }
  if (c.status === 'cfa_issued') {
    const why = c.cfa_type ? ` on the ground that ${CFA_TYPES[c.cfa_type].replace(/\s*\(Form \d+\)$/, '').replace(/^./, (x) => x.toLowerCase())}` : ''
    return `A Certification to File Action was issued on ${longDate(lastLog(logs, 'cfa_issued') || c.updated_at)}${why}.`
  }
  if (c.status === 'dismissed') {
    const why = c.dismissal_reason ? ` for the following reason: ${DISMISSAL_REASONS[c.dismissal_reason].replace(/\s*\(.*\)$/, '').toLowerCase()}` : ''
    return `The complaint was dismissed on ${longDate(lastLog(logs, 'dismissed') || c.updated_at)}${why}.`
  }
  if (OPEN_STAGES.includes(c.status)) return `As of this date, the case is pending and is at the ${stageLabel(c.status).toLowerCase()} stage.`
  return `Status: ${stageLabel(c.status)}.`
}

function Signatory({ caption, name, role }) {
  return (
    <div className="kp-avoid" style={{ width: 280 }}>
      <div>{caption}</div>
      <div style={{ marginTop: 40 }} className="kp-sig-line" />
      <div className="kp-sig-name">{name || ' '}</div>
      <div className="kp-sig-label">{role}</div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <tr>
      <th style={{ textAlign: 'left', width: '32%' }}>{label}</th>
      <td>{children || '—'}</td>
    </tr>
  )
}

function Certification({ req, c, logs, office }) {
  const p = dateParts(manilaDate(req.created_at))
  return (
    <>
      <div className="kp-title" style={{ marginTop: 34 }}>CERTIFICATION</div>
      <div className="kp-bold" style={{ marginTop: 24 }}>TO WHOM IT MAY CONCERN:</div>
      <p className="kp-para" style={{ textIndent: 48 }}>
        This is to certify that, based on the records of the Lupong Tagapamayapa of this Barangay, Barangay Case No.{' '}
        <b>{c.reference_number}</b>, entitled <b>{c.complainant_name}</b>, Complainant, versus <b>{c.respondent_name}</b>, Respondent, for{' '}
        <b>{c.category}</b>, was {c.status === 'declined' ? 'brought to this office' : `filed on ${longDate(filedAt(c))}`}.
      </p>
      <p className="kp-para" style={{ textIndent: 48 }}>
        {statusSentence(c, logs)}
      </p>
      <p className="kp-para" style={{ textIndent: 48 }}>
        This certification is issued upon the request of <b>{req.requester_name}</b>, {req.requester_relation.toLowerCase()}, for{' '}
        {req.purpose.toLowerCase()} purposes and for whatever legal purpose it may serve.
      </p>
      <p className="kp-para" style={{ textIndent: 48 }}>
        Issued this {p?.day} day of {p?.month}, {p?.year} at Barangay {office.barangay}, {office.localityType} of {office.locality}, {office.province}.
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, marginTop: 40, flexWrap: 'wrap' }}>
        <Signatory caption="Prepared by:" name={office.luponSecretary} role="Lupon Secretary" />
        <Signatory caption="Certified by:" name={office.punongBarangay} role="Punong Barangay / Lupon Chairman" />
      </div>
    </>
  )
}

function FullRecord({ req, c, logs, docs, office }) {
  const incident = [c.incident_date ? longDate(`${c.incident_date}T00:00:00+08:00`) : '', formatTime(c.incident_time)].filter(Boolean).join(' at ')
  return (
    <>
      <div className="kp-title" style={{ marginTop: 28, letterSpacing: '.2em' }}>CASE RECORD</div>

      <div className="kp-h">I. CASE INFORMATION</div>
      <table className="kp-table">
        <tbody>
          <Row label="Barangay Case No.">{c.reference_number}</Row>
          <Row label="Nature of case">{c.category}</Row>
          <Row label="Date filed">{c.status === 'declined' ? 'Not docketed' : longDate(filedAt(c))}</Row>
          <Row label="Complainant">
            {c.complainant_name}
            {c.complainant_address ? `, ${c.complainant_address}` : ''}
          </Row>
          <Row label="Respondent">
            {c.respondent_name}
            {c.respondent_address ? `, ${c.respondent_address}` : ''}
          </Row>
          <Row label="Date and place of incident">{[incident, c.location].filter(Boolean).join(' · ')}</Row>
          <Row label="Present status">{stageLabel(c.status)}</Row>
        </tbody>
      </table>

      <div className="kp-h">II. SUMMARY OF THE COMPLAINT</div>
      <div className="kp-para" style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>
        {c.description || '—'}
      </div>
      {c.relief_requested && (
        <div className="kp-para">
          <b>Relief requested:</b> {c.relief_requested}
        </div>
      )}

      <div className="kp-h">III. PROCEEDINGS</div>
      {logs.length === 0 ? (
        <div className="kp-small">No proceedings recorded yet.</div>
      ) : (
        <table className="kp-table">
          <thead>
            <tr>
              <th style={{ width: '24%' }}>Date</th>
              <th style={{ width: '24%' }}>Stage</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l, i) => (
              <tr key={i}>
                <td>{longDate(l.created_at)}</td>
                <td>{stageLabel(l.stage)}</td>
                <td>{l.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="kp-h">IV. OUTCOME</div>
      <div className="kp-para" style={{ marginTop: 4 }}>
        {statusSentence(c, logs)}
      </div>
      {c.settlement_terms && ['settled', 'execution', 'closed'].includes(c.status) && (
        <div className="kp-para">
          <b>Terms of settlement:</b> <span style={{ whiteSpace: 'pre-wrap' }}>{c.settlement_terms}</span>
        </div>
      )}

      <div className="kp-h">V. KP FORMS ISSUED</div>
      {docs.length === 0 ? (
        <div className="kp-small">No KP forms have been issued for this case.</div>
      ) : (
        <table className="kp-table">
          <thead>
            <tr>
              <th style={{ width: '14%' }}>Form</th>
              <th>Title</th>
              <th style={{ width: '28%' }}>Date issued</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td className="kp-num">{d.form_no}</td>
                <td>{d.form_title}</td>
                <td>{longDate(d.issued_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="kp-para" style={{ marginTop: 20 }}>
        Issued upon the request of <b>{req.requester_name}</b> ({req.requester_relation}) for {req.purpose.toLowerCase()}, on {longDate(req.created_at)}.
        This is a true summary of the records on file with the Lupong Tagapamayapa.
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, marginTop: 36, flexWrap: 'wrap' }}>
        <Signatory caption="Prepared by:" name={office.luponSecretary} role="Lupon Secretary" />
        <Signatory caption="Certified true and correct:" name={office.punongBarangay} role="Punong Barangay / Lupon Chairman" />
      </div>
    </>
  )
}

function CaseRecordPrint() {
  const { rid } = useParams()
  const [data, setData] = useState({ key: null })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: req } = await supabase.from('record_requests').select('*').eq('id', rid).maybeSingle()
      if (!req) {
        if (!cancelled) setData({ key: rid, req: null })
        return
      }
      const [office, { data: c }, { data: logs }, { data: docs }] = await Promise.all([
        loadOffice(),
        supabase.from('complaints').select('*').eq('id', req.complaint_id).maybeSingle(),
        supabase.from('case_activity_log').select('stage, remarks, created_at').eq('complaint_id', req.complaint_id).eq('entry_type', 'stage_change').order('created_at'),
        supabase.from('case_documents').select('id, form_no, form_title, issued_at').eq('complaint_id', req.complaint_id).eq('status', 'issued').order('issued_at'),
      ])
      if (!cancelled) setData({ key: rid, req, office, c, logs: logs || [], docs: docs || [] })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [rid])

  if (data.key !== rid) return <FormSkeleton />
  if (!data.req || !data.c) return <div className="p-10 text-center">Record request not found.</div>

  const { req, c, office } = data
  const cert = req.document === 'certification'

  return (
    <PrintShell
      title={`${cert ? 'Certification' : 'Case record'} · ${c.reference_number}`}
      docTitle={`${req.control_no} - ${c.reference_number}`}
      backTo="/admin/analytics"
      backLabel="Back to reports"
      fields={office}
      notice={
        <div className="mt-3 bg-info-soft border border-info-strong/20 text-info-strong text-sm rounded-xl px-4 py-3 flex gap-2.5 leading-relaxed">
          <MdOutlineInfo className="text-xl flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            Released to {req.requester_name} ({req.requester_relation}) on {longDate(req.created_at)} by {req.issued_by_name || 'a barangay official'}. Sign and
            stamp with the barangay seal before giving it out.
          </div>
        </div>
      }
    >
      <OfficeHeader />
      <div className="kp-meta">
        <span>Control No.: {req.control_no}</span>
        <span>Date: {longDate(req.created_at)}</span>
      </div>
      {cert ? <Certification req={req} c={c} logs={data.logs} office={office} /> : <FullRecord req={req} c={c} logs={data.logs} docs={data.docs} office={office} />}
      <div className="kp-foot">Not valid without the official barangay seal.</div>
    </PrintShell>
  )
}

export default CaseRecordPrint
