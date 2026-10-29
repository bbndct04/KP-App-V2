import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { MdOutlineSummarize, MdOutlineFindInPage, MdOutlinePrint, MdSearch, MdClose, MdArrowForward, MdOutlineHistory } from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { Card, CardHeader, Button, Field, Input, Select, StatusBadge } from '../ui'
import { currentMonth, longDate } from '../../lib/reports'
import { PURPOSES, RELATIONS } from '../../lib/outcomes'

function RequestDialog({ complaint, onClose }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ document: 'certification', name: complaint?.complainant_name || '', relation: 'Complainant', relationOther: '', purpose: PURPOSES[0], purposeOther: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  if (!complaint) return null
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function pickRelation(e) {
    const relation = e.target.value
    const name = relation === 'Complainant' ? complaint.complainant_name : relation === 'Respondent' ? complaint.respondent_name : ''
    setForm((f) => ({ ...f, relation, name: name || '' }))
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { data, error: rpcError } = await supabase.rpc('log_record_request', {
      p_complaint: complaint.id,
      p_document: form.document,
      p_name: form.name,
      p_relation: form.relation === 'Other' ? form.relationOther : form.relation,
      p_purpose: form.purpose === 'Other' ? form.purposeOther : form.purpose,
    })
    setSaving(false)
    if (rpcError) return setError(rpcError.message)
    navigate(`/admin/reports/request/${data.id}`)
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-5" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-2xl p-6 max-w-[480px] w-full shadow-token-lg flex flex-col gap-4 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-ink text-lg font-bold">Release a case record</div>
            <div className="text-ink-soft text-sm mt-0.5">
              {complaint.reference_number} · {complaint.complainant_name} vs. {complaint.respondent_name}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-faint hover:text-ink p-1">
            <MdClose className="text-xl" aria-hidden="true" />
          </button>
        </div>

        <Field label="Document">
          <div className="grid grid-cols-2 gap-2">
            {[
              ['certification', 'Certification', 'Short, signed status of the case'],
              ['record', 'Full case record', 'Details, proceedings, outcome, forms'],
            ].map(([value, label, hint]) => (
              <button
                type="button"
                key={value}
                onClick={() => setForm((f) => ({ ...f, document: value }))}
                aria-pressed={form.document === value}
                className={`text-left rounded-xl border p-3 transition-colors ${form.document === value ? 'border-accent bg-accent-soft' : 'border-border hover:bg-surface-hover'}`}
              >
                <div className="text-ink text-sm font-semibold">{label}</div>
                <div className="text-ink-faint text-xs mt-0.5">{hint}</div>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Requested by (relation to the case)" required>
          <Select value={form.relation} onChange={pickRelation}>
            {RELATIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </Field>
        {form.relation === 'Other' && (
          <Field label="Specify relation" required>
            <Input value={form.relationOther} onChange={set('relationOther')} required placeholder="e.g. Spouse of the complainant" />
          </Field>
        )}
        <Field label="Requester's full name" required hint="Check a valid ID before releasing.">
          <Input value={form.name} onChange={set('name')} required />
        </Field>
        <Field label="Purpose" required>
          <Select value={form.purpose} onChange={set('purpose')}>
            {PURPOSES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </Field>
        {form.purpose === 'Other' && (
          <Field label="Specify purpose" required>
            <Input value={form.purposeOther} onChange={set('purposeOther')} required placeholder="e.g. Loan application" />
          </Field>
        )}

        <div className="bg-surface-sunken rounded-xl px-3.5 py-2.5 text-xs text-ink-soft leading-relaxed">
          Case records contain personal information. Release them only to the parties, their authorized representative with a signed authorization, or a
          court or government office. This request is logged.
        </div>

        {error && (
          <div role="alert" className="bg-danger-soft border border-danger-strong/20 text-danger-strong text-sm rounded-lg px-3.5 py-2.5">
            {error}
          </div>
        )}
        <div className="flex gap-2.5 justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" icon={MdOutlinePrint} disabled={saving}>
            {saving ? 'Saving...' : 'Log and open'}
          </Button>
        </div>
      </form>
    </div>,
    document.body
  )
}

function PrintReports() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(currentMonth())
  const [cases, setCases] = useState([])
  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: r }] = await Promise.all([
        supabase
          .from('complaints')
          .select('id, reference_number, status, category, complainant_name, respondent_name, created_at')
          .neq('status', 'submitted')
          .order('created_at', { ascending: false }),
        supabase.from('record_requests').select('*, complaints(reference_number)').order('created_at', { ascending: false }).limit(8),
      ])
      setCases(c || [])
      setRequests(r || [])
    }
    load()
  }, [])

  const matches = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return []
    return cases
      .filter((c) => c.reference_number?.toLowerCase().includes(s) || c.complainant_name?.toLowerCase().includes(s) || c.respondent_name?.toLowerCase().includes(s))
      .slice(0, 6)
  }, [cases, search])

  return (
    <div className="grid lg:grid-cols-2 gap-5 mb-5">
      <Card>
        <CardHeader icon={MdOutlineSummarize} title="Monthly KP report" subtitle="Printable report for submission and documentation" />
        <div className="p-5 flex flex-col gap-4">
          <p className="text-ink-soft text-sm">
            Lists the cases filed or acted on during the month, with totals for settled, CFA, dismissed and pending cases, ready to sign.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Input type="month" value={month} max={currentMonth()} onChange={(e) => setMonth(e.target.value)} aria-label="Report month" className="sm:max-w-[220px]" />
            <Button icon={MdOutlinePrint} disabled={!month} onClick={() => navigate(`/admin/reports/monthly?m=${month}`)}>
              Open report
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-visible">
        <CardHeader icon={MdOutlineFindInPage} title="Case record request" subtitle="Print a certification or full record for a requester" />
        <div className="p-5 flex flex-col gap-3">
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-ink-faint pointer-events-none" aria-hidden="true" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Case number or name of a party" aria-label="Find a case" className="pl-10" />
          </div>
          {search.trim() && (
            <ul className="border border-border rounded-xl divide-y divide-border overflow-hidden">
              {matches.length === 0 ? (
                <li className="px-4 py-3 text-sm text-ink-faint">No matching case.</li>
              ) : (
                matches.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => setPicked(c)} className="w-full text-left px-4 py-3 hover:bg-surface-hover flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-ink text-sm font-semibold">{c.reference_number}</div>
                        <div className="text-ink-faint text-xs truncate">
                          {c.complainant_name} vs. {c.respondent_name} · {c.category}
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}

          <div className="flex items-center gap-2 text-ink-soft text-xs font-semibold uppercase tracking-wide mt-2">
            <MdOutlineHistory className="text-base" aria-hidden="true" /> Recently released
          </div>
          {requests.length === 0 ? (
            <div className="text-ink-faint text-sm">No records released yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {requests.map((r) => (
                <li key={r.id}>
                  <Link to={`/admin/reports/request/${r.id}`} className="flex items-center gap-3 py-2.5 hover:bg-surface-hover -mx-2 px-2 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <div className="text-ink text-sm font-semibold">
                        {r.control_no} <span className="text-ink-faint font-normal">· {r.complaints?.reference_number}</span>
                      </div>
                      <div className="text-ink-faint text-xs truncate">
                        {r.requester_name} ({r.requester_relation}) · {r.purpose} · {longDate(r.created_at)}
                      </div>
                    </div>
                    <MdArrowForward className="text-accent flex-shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <RequestDialog key={picked?.id || 'none'} complaint={picked} onClose={() => setPicked(null)} />
    </div>
  )
}

export default PrintReports
