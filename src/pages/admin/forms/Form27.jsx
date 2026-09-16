import { useComplaintForForm, fmtDate, FormPage, FormHeader, PartiesTable } from './FormShell'

function Form27() {
  const { complaint, loading } = useComplaintForForm()
  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!complaint) return <div className="p-10 text-center">Complaint not found.</div>
  const now = new Date()
  const hearingStr = complaint.hearing_date ? `${fmtDate(complaint.hearing_date, 'month')} ${fmtDate(complaint.hearing_date, 'day')}, ${fmtDate(complaint.hearing_date, 'year')}` : '____________'

  return (
    <FormPage>
      <FormHeader />
      <PartiesTable complaint={complaint} />

      <div className="font-bold text-[13px] uppercase text-center my-4">NOTICE OF EXECUTION</div>

      <div className="text-justify leading-loose my-2.5">
        WHEREAS, on <u>{hearingStr}</u> (date), an amicable settlement was signed by
        the parties in the above-entitled case [or an arbitration award was rendered by
        the Punong Barangay/Pangkat ng Tagapagkasundo];<br />

        WHEREAS, the terms and conditions of the settlement, the dispositive portion
        of the award, read:
      </div>

      <div className="my-3">
        <div className="border-b border-black mb-1">&nbsp;</div>
        <div className="border-b border-black mb-1">&nbsp;</div>
        <div className="border-b border-black mb-1">&nbsp;</div>
        {complaint.settlement_terms || ''}
      </div>

      <div className="text-justify leading-loose my-2.5">
        The said settlement/award is now final and executory;<br /><br />

        WHEREAS, the party obliged <u>{complaint.respondent_name}</u> (name)
        has not complied voluntarily with the aforestated amicable settlement/arbitration
        award, within the period of five (5) days from the date of hearing on the motion
        for execution;<br />

        NOW, THEREFORE, in behalf of the Lupong Tagapamayapa and by virtue of the
        powers vested in me and the Lupon by the Katarungang Pambarangay Law and
        Rules, I shall cause to be realized from the goods and personal property of{' '}
        <u>{complaint.respondent_name}</u> (name of party obliged) the sum of{' '}
        <u>____________________</u> (state amount of settlement or award) upon in the
        said amicable settlement [or adjudged in the said arbitration award], unless
        voluntary compliance of said settlement or award shall have been made upon
        receipt hereof.<br />

        Signed this <u>{fmtDate(now, 'day')}</u> day of <u>{fmtDate(now, 'month')}</u>, <u>{fmtDate(now, 'year')}</u>.
      </div>

      <div className="border-b border-black w-[220px] mt-5 mb-1">&nbsp;</div>
      Punong Barangay
      <br /><br />

      Copy furnished:
      <table className="w-full mt-2.5">
        <tbody>
          <tr>
            <td>
              <div className="border-b border-black mb-1">&nbsp;</div>
              Complainant/s<br />
              <span className="text-[11px]">{complaint.complainant_name}</span>
            </td>
            <td>
              <div className="border-b border-black mb-1">&nbsp;</div>
              Respondent/s<br />
              <span className="text-[11px]">{complaint.respondent_name}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </FormPage>
  )
}

export default Form27