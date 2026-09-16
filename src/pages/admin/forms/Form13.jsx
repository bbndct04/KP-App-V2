import { useComplaintForForm, fmtDate, fmtTime, FormPage, FormHeader, PartiesTable } from './FormShell'

function Form13() {
  const { complaint, loading } = useComplaintForForm()
  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!complaint) return <div className="p-10 text-center">Complaint not found.</div>
  const now = new Date()

  return (
    <FormPage>
      <FormHeader />
      <PartiesTable complaint={complaint} />

      <div className="font-bold text-[13px] uppercase text-center my-4 tracking-widest">S U B P O E N A</div>

      <div className="text-justify leading-loose my-2.5">
        TO: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>
        <br />
        <div className="text-center text-[11px]">Witnesses</div>
      </div>

      <div className="text-justify leading-loose my-2.5">
        You are hereby commanded to appear before me on the <u>{fmtDate(complaint.hearing_date, 'day')}</u> day
        of <u>{fmtDate(complaint.hearing_date, 'month')}</u>, <u>{fmtDate(complaint.hearing_date, 'year')}</u>,
        at <u>{fmtTime(complaint.hearing_time)}</u> o'clock, then and there to testify in the hearing of the
        above-captioned case.
      </div>

      <div className="text-justify leading-loose my-2.5">
        This <u>{fmtDate(now, 'day')}</u> day of <u>{fmtDate(now, 'month')}</u>, <u>{fmtDate(now, 'year')}</u>.
      </div>

      <div className="border-b border-black w-[220px] mt-5 mb-1">&nbsp;</div>
      Punong Barangay/Pangkat Chairman<br />
      <span className="text-[11px]">(Cross out whichever one is not applicable).</span>
    </FormPage>
  )
}

export default Form13