import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PrintShell from '../../../components/forms/PrintShell'
import { OfficeHeader } from '../../../components/forms/blocks'
import { Input } from '../../../components/ui'
import { FormSkeleton } from '../forms/FormShell'
import { supabase } from '../../../lib/supabaseClient'
import { buildMonthlyReport, currentMonth, loadOffice, longDate, monthLabel } from '../../../lib/reports'

function SummaryRow({ label, value, indent = false, bold = false }) {
  return (
    <tr>
      <td style={{ paddingLeft: indent ? 26 : undefined, fontWeight: bold ? 700 : undefined }}>{label}</td>
      <td className="kp-num" style={{ fontWeight: bold ? 700 : undefined, width: 90 }}>
        {value}
      </td>
    </tr>
  )
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

function MonthlyReport() {
  const [params, setParams] = useSearchParams()
  const ym = /^\d{4}-\d{2}$/.test(params.get('m') || '') ? params.get('m') : currentMonth()
  const [data, setData] = useState({ key: null })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [office, { data: complaints }, { data: logs }] = await Promise.all([
        loadOffice(),
        supabase
          .from('complaints')
          .select('id, reference_number, status, category, complainant_name, respondent_name, created_at, reviewed_at, settlement_type, cfa_type, dismissal_reason'),
        supabase.from('case_activity_log').select('complaint_id, stage, created_at').eq('entry_type', 'stage_change'),
      ])
      if (!cancelled) setData({ key: ym, office, report: buildMonthlyReport(ym, complaints || [], logs || []) })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [ym])

  if (data.key !== ym) return <FormSkeleton />
  const { office, report } = data
  const { sum, natures, rows } = report

  return (
    <PrintShell
      title={`Monthly KP Report · ${monthLabel(ym)}`}
      docTitle={`KP Monthly Report - ${monthLabel(ym)}`}
      backTo="/admin/analytics"
      backLabel="Back to reports"
      fields={office}
      actions={
        <Input
          type="month"
          value={ym}
          max={currentMonth()}
          onChange={(e) => e.target.value && setParams({ m: e.target.value })}
          aria-label="Report month"
          className="w-auto py-2"
        />
      }
    >
      <OfficeHeader />
      <div className="kp-title" style={{ letterSpacing: '.08em', paddingLeft: 0, marginBottom: 2 }}>
        MONTHLY REPORT ON KATARUNGANG PAMBARANGAY CASES
      </div>
      <div className="kp-center">For the month of {monthLabel(ym)}</div>

      <div className="kp-h">I. SUMMARY OF CASES</div>
      <table className="kp-table">
        <tbody>
          <SummaryRow label="Cases pending from previous months" value={sum.carried} />
          <SummaryRow label="New cases filed this month" value={sum.filed} />
          <SummaryRow label="Total cases handled" value={sum.handled} bold />
          <SummaryRow label="Cases settled this month" value={sum.settledTotal} bold />
          <SummaryRow label="through mediation (Punong Barangay)" value={sum.settled.mediation} indent />
          <SummaryRow label="through conciliation (Pangkat ng Tagapagkasundo)" value={sum.settled.conciliation} indent />
          <SummaryRow label="through arbitration" value={sum.settled.arbitration} indent />
          <SummaryRow label="Certifications to file action issued" value={sum.cfa} />
          <SummaryRow label="of which, settlement was repudiated" value={sum.repudiated} indent />
          <SummaryRow label="Cases dismissed" value={sum.dismissed} />
          <SummaryRow label="of which, withdrawn by the complainant" value={sum.withdrawn} indent />
          <SummaryRow label="Settlements fully complied with" value={sum.complied} />
          <SummaryRow label="Cases pending at the end of the month" value={sum.pendingEnd} bold />
          <SummaryRow label="Complaints received but not docketed (declined)" value={sum.declined} />
        </tbody>
      </table>

      <div className="kp-h">II. NEW CASES BY NATURE</div>
      {natures.length === 0 ? (
        <div className="kp-small">No new cases were filed this month.</div>
      ) : (
        <table className="kp-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Nature of case</th>
              <th style={{ width: 90 }}>Number</th>
            </tr>
          </thead>
          <tbody>
            {natures.map(([n, count]) => (
              <SummaryRow key={n} label={n} value={count} />
            ))}
          </tbody>
        </table>
      )}

      <div className="kp-h">III. LIST OF CASES FILED OR ACTED UPON</div>
      {rows.length === 0 ? (
        <div className="kp-small">No cases were filed or acted upon this month.</div>
      ) : (
        <table className="kp-table">
          <thead>
            <tr>
              <th>No.</th>
              <th style={{ width: '14%' }}>Case No.</th>
              <th style={{ width: '22%' }}>Parties</th>
              <th style={{ width: '12%' }}>Nature</th>
              <th style={{ width: '12%' }}>Date filed</th>
              <th>Action taken this month</th>
              <th style={{ width: '12%' }}>Status as of month end</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="kp-num">{i + 1}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{r.caseNo}</td>
                <td>{r.parties}</td>
                <td>{r.nature}</td>
                <td>{longDate(r.filed)}</td>
                <td>{r.actions.join('; ')}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, marginTop: 44, flexWrap: 'wrap' }}>
        <Signatory caption="Prepared by:" name={office.luponSecretary} role="Lupon Secretary" />
        <Signatory caption="Noted by:" name={office.punongBarangay} role="Punong Barangay / Lupon Chairman" />
      </div>

      <div className="kp-foot" style={{ fontStyle: 'normal' }}>
        Generated from the KP App records on {longDate(new Date())}.
      </div>
    </PrintShell>
  )
}

export default MonthlyReport
