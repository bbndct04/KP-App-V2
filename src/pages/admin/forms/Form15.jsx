import { useComplaintForForm, fmtDate, FormPage, FormHeader, PartiesTable } from './FormShell'

function Form15() {
  const { complaint, loading } = useComplaintForForm()
  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!complaint) return <div className="p-10 text-center">Complaint not found.</div>
  const now = new Date()

  return (
    <FormPage>
      <FormHeader />
      <PartiesTable complaint={complaint} />

      <div className="font-bold text-[13px] uppercase text-center my-4">ARBITRATION AWARD</div>

      <div className="text-justify leading-loose my-2.5">
        After hearing the testimonies given and careful examination of the evidence
        presented in this case, award is hereby made as follows:
      </div>

      <div className="my-4">
        <div className="border-b border-black mb-1">&nbsp;</div>
        <div className="border-b border-black mb-1">&nbsp;</div>
        <div className="border-b border-black mb-1">&nbsp;</div>
        {complaint.settlement_terms || ''}
      </div>

      <div className="text-justify leading-loose my-2.5">
        Made this <u>{fmtDate(now, 'day')}</u> day of <u>{fmtDate(now, 'month')}</u>, <u>{fmtDate(now, 'year')}</u> at{' '}
        <u>Barangay New Kababae, Olongapo City</u>.
      </div>

      <div className="border-b border-black w-[220px] mt-5 mb-1">&nbsp;</div>
      Punong Barangay/Pangkat Chairman *
      <br /><br />
      <div className="border-b border-black w-[220px] mb-1">&nbsp;</div>
      Member
      <br /><br />
      <div className="border-b border-black w-[220px] mb-1">&nbsp;</div>
      Member
      <br /><br />
      ATTESTED:
      <br /><br />
      <div className="border-b border-black w-[220px] mb-1">&nbsp;</div>
      Punong Barangay/Lupon Secretary **

      <div className="text-[11px] mt-4">
        * To be signed by either, whoever made the arbitration award.<br />
        ** To be signed by the Punong Barangay if the award is made by the Pangkat
        Chairman, and by the Lupon Secretary if the award is made by the Punong Barangay.
      </div>
    </FormPage>
  )
}

export default Form15