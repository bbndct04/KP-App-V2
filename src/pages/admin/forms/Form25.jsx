import { useComplaintForForm, fmtDate, FormPage, FormHeader, PartiesTable } from './FormShell'

function Form25() {
  const { complaint, loading } = useComplaintForForm()
  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!complaint) return <div className="p-10 text-center">Complaint not found.</div>
  const now = new Date()
  const hearingStr = complaint.hearing_date ? `${fmtDate(complaint.hearing_date, 'month')} ${fmtDate(complaint.hearing_date, 'day')}, ${fmtDate(complaint.hearing_date, 'year')}` : '____________'

  return (
    <FormPage>
      <FormHeader />
      <PartiesTable complaint={complaint} />

      <div className="font-bold text-[13px] uppercase text-center my-4">MOTION FOR EXECUTION</div>

      <div className="my-2.5">Complainant/s Respondent/s state as follows:</div>

      <div className="text-justify leading-loose my-2.5">
        1. On <u>{hearingStr}</u> (Date) the parties in this case signed an amicable
        settlement/received the arbitration award rendered by the Lupon/Chairman/Pangkat
        ng Tagapagkasundo;<br /><br />

        2. The period of ten (10) days from the above-stated date has expired without
        any of the parties filing a sworn statement of repudiation of the settlement
        before the Lupon Chairman a petition for nullification of the arbitration award
        in court; and<br /><br />

        3. The amicable settlement/arbitration award is now final and executory.
        WHEREFORE, Complainant/s Respondent/s request that the corresponding writ
        of execution be issued by the Lupon Chairman in this case.
      </div>

      <div className="my-2.5">
        <u>{fmtDate(now, 'month')} {fmtDate(now, 'day')}, {fmtDate(now, 'year')}</u><br />
        (Date)
      </div>

      <div className="border-b border-black w-[220px] mt-5 mb-1">&nbsp;</div>
      Complainant/s Respondent/s
    </FormPage>
  )
}

export default Form25