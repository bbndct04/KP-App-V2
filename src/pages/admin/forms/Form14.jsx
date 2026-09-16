import { useComplaintForForm, fmtDate, FormPage, FormHeader, PartiesTable } from './FormShell'

function Form14() {
  const { complaint, loading } = useComplaintForForm()
  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!complaint) return <div className="p-10 text-center">Complaint not found.</div>
  const now = new Date()

  return (
    <FormPage>
      <FormHeader />
      <PartiesTable complaint={complaint} />

      <div className="font-bold text-[13px] uppercase text-center my-4">AGREEMENT FOR ARBITRATION</div>

      <div className="text-justify leading-loose my-2.5">
        We hereby agree to submit our dispute for arbitration to the Punong Barangay/
        Pangkat ng Tagapagkasundo (Please cross out whichever is not applicable)
        and bind ourselves to comply with the award that may be rendered thereon.
        We have made this agreement freely with a full understanding of its nature and
        consequences.<br />
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
        <strong>ATTESTATION</strong>
        <div className="text-justify leading-loose my-2.5">
          I hereby certify that the foregoing Agreement for Arbitration was entered into
          by the parties freely and voluntarily, after I had explained to them the nature
          and the consequences of such agreement.
        </div>
        <div className="border-b border-black w-[220px] mt-5 mb-1">&nbsp;</div>
        Punong Barangay/Pangkat Chairman<br />
        <span className="text-[11px]">(Cross out whichever one is not applicable.)</span>
      </div>
    </FormPage>
  )
}

export default Form14