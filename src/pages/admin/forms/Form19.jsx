import { useComplaintForForm, fmtDate, fmtTime, FormPage, FormHeader, PartiesTable } from './FormShell'

function Form19() {
  const { complaint, loading } = useComplaintForForm()
  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!complaint) return <div className="p-10 text-center">Complaint not found.</div>
  const now = new Date()

  return (
    <FormPage>
      <FormHeader />
      <PartiesTable complaint={complaint} />

      <div className="font-bold text-[13px] uppercase text-center my-4">
        NOTICE OF HEARING<br />(RE: FAILURE TO APPEAR)
      </div>

      <div className="text-justify leading-loose my-2.5">
        TO: <u>{complaint.respondent_name}</u><br />
        <div className="text-center text-[11px]">Respondent/s</div>
      </div>

      <div className="text-justify leading-loose my-2.5">
        You are hereby required to appear me/the Pangkat on the{' '}
        <u>{fmtDate(complaint.hearing_date, 'day')}</u> day of <u>{fmtDate(complaint.hearing_date, 'month')}</u>,{' '}
        <u>{fmtDate(complaint.hearing_date, 'year')}</u>, at <u>{fmtTime(complaint.hearing_time)}</u> o'clock in the
        morning/afternoon to explain why you failed to appear for mediation/conciliation
        scheduled on <u>{complaint.hearing_date ? `${fmtDate(complaint.hearing_date, 'month')} ${fmtDate(complaint.hearing_date, 'day')}, ${fmtDate(complaint.hearing_date, 'year')}` : '____________'}</u>{' '}
        and why your counterclaim (if any) arising from the complaint should not be
        dismissed, a certificate to bar the filing of said counterclaim in court/government
        office should not be issued, and contempt proceedings should not be initiated in
        court for willful failure or refusal to appear before the Punong Barangay/Pangkat
        ng Tagapagkasundo.
      </div>

      <div className="text-justify leading-loose my-2.5">
        This <u>{fmtDate(now, 'day')}</u> day of <u>{fmtDate(now, 'month')}</u>, <u>{fmtDate(now, 'year')}</u>.
      </div>

      <div className="border-b border-black w-[220px] mt-5 mb-1">&nbsp;</div>
      Punong Barangay/Pangkat Chairman<br />
      <span className="text-[11px]">(Cross out whichever is not applicable)</span>
      <br /><br />

      Notified this <u>________</u> day of <u>____________</u>, <u>{fmtDate(now, 'year')}</u>.
      <br /><br />

      <table className="w-full">
        <tbody>
          <tr>
            <td>Respondent/s<br /><div className="border-b border-black mt-5 mb-1">&nbsp;</div></td>
            <td>Complainant/s<br /><div className="border-b border-black mt-5 mb-1">&nbsp;</div></td>
          </tr>
        </tbody>
      </table>
    </FormPage>
  )
}

export default Form19