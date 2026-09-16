import { useComplaintForForm, fmtDate, fmtTime, FormPage, FormHeader, PartiesTable } from './FormShell'

function Form8() {
  const { complaint, loading } = useComplaintForForm()
  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!complaint) return <div className="p-10 text-center">Complaint not found.</div>

  const now = new Date()

  return (
    <FormPage>
      <FormHeader />
      <PartiesTable complaint={complaint} />

      <div className="font-bold text-[13px] uppercase text-center my-4">
        NOTICE OF HEARING<br />(MEDIATION PROCEEDINGS)
      </div>

      <div className="text-justify leading-loose my-2.5">
        TO: <u>{complaint.complainant_name}</u><br />
        <div className="text-center text-[11px]">Complainant/s</div>
      </div>

      <div className="text-justify leading-loose my-2.5">
        You are hereby required to appear before me on the{' '}
        <u>{fmtDate(complaint.hearing_date, 'day')}</u> day of{' '}
        <u>{fmtDate(complaint.hearing_date, 'month')}</u>,{' '}
        <u>{fmtDate(complaint.hearing_date, 'year')}</u> at{' '}
        <u>{fmtTime(complaint.hearing_time)}</u> o'clock in the morning/afternoon for
        the hearing of your complaint.
      </div>

      <div className="text-justify leading-loose my-2.5">
        This <u>{fmtDate(now, 'day')}</u> day of <u>{fmtDate(now, 'month')}</u>, <u>{fmtDate(now, 'year')}</u>.
      </div>

      <div className="mt-5">
        <div className="border-b border-black w-[220px] mb-1">&nbsp;</div>
        Punong Barangay/Lupon Chairman
        <br /><br />
        Notified this <u>________</u> day of <u>________</u>, <u>{fmtDate(now, 'year')}</u>.
        <br /><br />
        Complainant/s:<br />
        <div className="border-b border-black w-[220px] mb-1">&nbsp;</div>
      </div>
    </FormPage>
  )
}

export default Form8