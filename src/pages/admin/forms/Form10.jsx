import { useComplaintForForm, fmtDate, fmtTime, FormPage, FormHeader } from './FormShell'

function Form10() {
  const { complaint, loading } = useComplaintForForm()
  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!complaint) return <div className="p-10 text-center">Complaint not found.</div>

  const now = new Date()

  return (
    <FormPage>
      <FormHeader office="OFFICE OF THE PUNONG BARANGAY" />

      <div className="font-bold text-[13px] uppercase text-center my-4">NOTICE FOR CONSTITUTION OF PANGKAT</div>

      <div className="text-justify leading-loose my-2.5">
        TO: <u>{complaint.complainant_name}</u> &nbsp;&nbsp;&nbsp;&nbsp; <u>{complaint.respondent_name}</u><br />
        <div className="flex justify-between text-[11px]">
          <span>Complainant/s</span>
          <span>Respondent/s</span>
        </div>
      </div>

      <div className="text-justify leading-loose my-2.5">
        You are hereby required to appear before me on the{' '}
        <u>{fmtDate(complaint.hearing_date, 'day')}</u> day of{' '}
        <u>{fmtDate(complaint.hearing_date, 'month')}</u>, <u>{fmtDate(complaint.hearing_date, 'year')}</u>,
        at <u>{fmtTime(complaint.hearing_time)}</u> o'clock in the morning/afternoon for
        the constitution of the Pangkat ng Tagapagkasundo which shall conciliate your
        dispute. Should you fail to agree on the Pangkat membership or to appear on
        the aforesaid date for the constitution of the Pangkat, I shall determine the
        membership thereof by drawing lots.
      </div>

      <div className="text-justify leading-loose my-2.5">
        This <u>{fmtDate(now, 'day')}</u> day of <u>{fmtDate(now, 'month')}</u>, <u>{fmtDate(now, 'year')}</u>.
      </div>

      <div className="border-b border-black w-[220px] mt-5 mb-1">&nbsp;</div>
      Punong Barangay
      <br /><br />
      Notified this <u>________</u> day of <u>____________</u>, <u>{fmtDate(now, 'year')}</u>.
      <br /><br />

      <table className="w-full">
        <tbody>
          <tr>
            <td className="w-1/2">
              TO:<br />
              <div className="border-b border-black w-[180px] mb-1">&nbsp;</div>
              Complainant/s
            </td>
            <td className="w-1/2">
              <br />
              <div className="border-b border-black w-[180px] mb-1">&nbsp;</div>
              Respondent/s
            </td>
          </tr>
        </tbody>
      </table>
    </FormPage>
  )
}

export default Form10