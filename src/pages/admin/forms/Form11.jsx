import { useComplaintForForm, fmtDate, FormPage, FormHeader, PartiesTable } from './FormShell'

function Form11() {
  const { complaint, loading } = useComplaintForForm()
  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!complaint) return <div className="p-10 text-center">Complaint not found.</div>

  const now = new Date()

  return (
    <FormPage>
      <FormHeader />
      <PartiesTable complaint={complaint} />

      <div className="font-bold text-[13px] uppercase text-center my-4">NOTICE TO CHOSEN PANGKAT MEMBER</div>

      <div className="text-right">
        (Date): <u>{fmtDate(now, 'month')} {fmtDate(now, 'day')}, {fmtDate(now, 'year')}</u>
      </div>

      <div className="text-justify leading-loose my-2.5">
        TO: <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>
      </div>

      <div className="text-justify leading-loose my-2.5">
        Notice is hereby given that you have been chosen member of the Pangkat ng
        Tagapagkasundo amicably conciliate the dispute between the parties in the
        above-entitled case.
      </div>

      <div className="border-b border-black w-[220px] mt-5 mb-1">&nbsp;</div>
      Punong Barangay/Lupon Secretary
      <br /><br />

      Received this <u>________</u> day of <u>____________</u>, <u>{fmtDate(now, 'year')}</u>.
      <br /><br />

      <div className="border-b border-black w-[220px] mb-1">&nbsp;</div>
      Pangkat Member
    </FormPage>
  )
}

export default Form11