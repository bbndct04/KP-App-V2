import { useComplaintForForm, fmtDate, FormPage, FormHeader, PartiesTable } from './FormShell'

function Form16() {
  const { complaint, loading } = useComplaintForForm()
  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!complaint) return <div className="p-10 text-center">Complaint not found.</div>

  const now = new Date()

  return (
    <FormPage>
      <FormHeader />
      <PartiesTable complaint={complaint} />

      <div className="font-bold text-[13px] uppercase text-center my-4">AMICABLE SETTLEMENT</div>

      <div className="text-justify leading-loose my-2.5">
        We, complainant/s and respondent/s in the above-captioned case, do hereby
        agree to settle our dispute as follows:
      </div>

      <div className="my-4">
        <div className="border-b border-black mb-1">&nbsp;</div>
        <div className="border-b border-black mb-1">&nbsp;</div>
        <div className="border-b border-black mb-1">&nbsp;</div>
        {complaint.settlement_terms || complaint.description}
      </div>

      <div className="text-justify leading-loose my-2.5">
        and bind ourselves to comply honestly and faithfully with the above terms of settlement.<br />
        Entered into this <u>{fmtDate(now, 'day')}</u> day of <u>{fmtDate(now, 'month')}</u>, <u>{fmtDate(now, 'year')}</u>.
      </div>

      <table className="w-full mt-5">
        <tbody>
          <tr>
            <td className="w-1/2 align-top">
              <div className="border-b border-black w-[220px] mb-1">&nbsp;</div>
              Complainant/s<br />
              <span className="text-[11px]">{complaint.complainant_name}</span>
            </td>
            <td className="w-1/2 align-top">
              <div className="border-b border-black w-[220px] mb-1">&nbsp;</div>
              Respondent/s<br />
              <span className="text-[11px]">{complaint.respondent_name}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-6">
        <div className="font-bold text-center">ATTESTATION</div>
        <div className="text-justify leading-loose my-2.5">
          I hereby certify that the foregoing amicable settlement was entered into by the
          parties freely and voluntarily, after I had explained to them the nature and
          consequence of such settlement.
        </div>
        <div className="border-b border-black w-[220px] mt-5 mb-1">&nbsp;</div>
        Punong Barangay/Pangkat Chairman
      </div>
    </FormPage>
  )
}

export default Form16