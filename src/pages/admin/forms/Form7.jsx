import { useComplaintForForm, fmtDate, FormPage, FormHeader, PartiesTable } from './FormShell'

function Form7() {
  const { complaint, loading } = useComplaintForForm()
  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!complaint) return <div className="p-10 text-center">Complaint not found.</div>

  return (
    <FormPage>
      <FormHeader />
      <PartiesTable complaint={complaint} />

      <div className="font-bold text-[13px] uppercase text-center my-4 tracking-widest">C O M P L A I N T</div>

      <div className="text-justify leading-loose">
        I/WE hereby complain against above named respondent/s for violating my/our
        rights and interests in the following manner:
      </div>

      <div className="my-4">
        <div className="border-b border-black mb-1">&nbsp;</div>
        <div className="border-b border-black mb-1">&nbsp;</div>
        <div className="border-b border-black mb-1">&nbsp;</div>
        {complaint.description}
      </div>

      <div className="text-justify leading-loose">
        THEREFORE, I/WE pray that the following relief/s be granted to me/us in
        accordance with law and/or equity:
      </div>

      <div className="my-4">
        <div className="border-b border-black mb-1">&nbsp;</div>
        <div className="border-b border-black mb-1">&nbsp;</div>
        {complaint.relief_requested}
      </div>

      <div>
        Made this <u>{fmtDate(complaint.created_at, 'day')}</u> day of{' '}
        <u>{fmtDate(complaint.created_at, 'month')}</u>, <u>{fmtDate(complaint.created_at, 'year')}</u>.
      </div>

      <div className="mt-5">
        <div className="border-b border-black w-[220px] mb-1">&nbsp;</div>
        <div>Complainant/s</div>
        <br />
        Received and filed this <u>{fmtDate(complaint.created_at, 'day')}</u> day of{' '}
        <u>{fmtDate(complaint.created_at, 'month')}</u>, <u>{fmtDate(complaint.created_at, 'year')}</u>.
        <br /><br />
        <div className="border-b border-black w-[220px] mb-1">&nbsp;</div>
        <div>Punong Barangay/Lupon Chairman</div>
      </div>
    </FormPage>
  )
}

export default Form7