import { useComplaintForForm, fmtDate, fmtTime, FormPage, FormHeader, PartiesTable } from './FormShell'

function Form9() {
  const { complaint, loading } = useComplaintForForm()
  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!complaint) return <div className="p-10 text-center">Complaint not found.</div>

  const now = new Date()

  return (
    <FormPage>
      <FormHeader />
      <PartiesTable complaint={complaint} />

      <div className="font-bold text-[13px] uppercase text-center my-4 tracking-widest">S U M M O N S</div>

      <div className="text-justify leading-loose my-2.5">
        TO: <u>{complaint.respondent_name}</u> &nbsp;&nbsp; <u>{complaint.respondent_address}</u><br />
        <div className="text-center text-[11px]">Respondents</div>
      </div>

      <div className="text-justify leading-loose my-2.5">
        You are hereby summoned to appear before me in person, together with your
        witnesses, on the <u>{fmtDate(complaint.hearing_date, 'day')}</u> day of{' '}
        <u>{fmtDate(complaint.hearing_date, 'month')}</u>, <u>{fmtDate(complaint.hearing_date, 'year')}</u> at{' '}
        <u>{fmtTime(complaint.hearing_time)}</u> o'clock in the morning/afternoon, then
        and there to answer to a complaint made before me, copy of which is attached
        hereto, for mediation/conciliation of your dispute with complainant/s.
      </div>

      <div className="text-justify leading-loose my-2.5">
        You are hereby warned that if you refuse or willfully fail to appear in
        obedience to this summons, you may be barred from filing any counterclaim
        arising from said complaint.
      </div>

      <div className="text-justify leading-loose my-2.5 font-bold">
        FAIL NOT or else face punishment as for contempt of court.
      </div>

      <div className="text-justify leading-loose my-2.5">
        This <u>{fmtDate(now, 'day')}</u> day of <u>{fmtDate(now, 'month')}</u>, <u>{fmtDate(now, 'year')}</u>.
      </div>

      <div className="border-b border-black w-[220px] mt-5 mb-1">&nbsp;</div>
      Punong Barangay/Pangkat Chairman

      <div className="break-before-page mt-10 pt-10 border-t-2 border-dashed">
        <div className="font-bold text-[13px] uppercase text-center my-4">OFFICER'S RETURN</div>

        <div className="text-justify leading-loose">
          I served this summons upon respondent <u>{complaint.respondent_name}</u> on
          the <u>________</u> day of <u>____________</u>, <u>{fmtDate(now, 'year')}</u>,
          and upon respondent <u>____________________</u> on the day of{' '}
          <u>____________</u>, <u>{fmtDate(now, 'year')}</u>, by:
          <br /><br />
          (Write name/s of respondent/s before mode by which he/they was/were served.)
          <br /><br />
          Respondent/s
        </div>

        <table className="w-full mt-2.5">
          <tbody>
            <tr>
              <td className="w-2/5 align-top">
                <div className="border-b border-black mb-1">&nbsp;</div> 1.
                <div className="border-b border-black mb-1">&nbsp;</div> 2.
                <div className="border-b border-black mb-1">&nbsp;</div> 3.
                <div className="border-b border-black mb-1">&nbsp;</div> 4.
              </td>
              <td className="w-3/5 align-top text-[11px] leading-loose">
                handing to him/them said summons in person, or<br />
                handing to him/them said summons and he/they refused to receive it, or<br />
                leaving said summons at his/their dwelling with <u>__________</u> (name) a person of suitable age and discretion residing therein, or<br />
                leaving said summons at his/their office/place of business with <u>__________</u> (name) a competent person in charge thereof.
              </td>
            </tr>
          </tbody>
        </table>

        <br />
        <div className="border-b border-black w-[150px] mb-1">&nbsp;</div>
        Officer
        <br /><br />
        Received by Respondent/s representative/s:
        <table className="w-full mt-2.5">
          <tbody>
            <tr>
              <td><div className="border-b border-black mb-1">&nbsp;</div>Signature</td>
              <td><div className="border-b border-black mb-1">&nbsp;</div>Date</td>
            </tr>
            <tr>
              <td><div className="border-b border-black mb-1">&nbsp;</div>Signature</td>
              <td><div className="border-b border-black mb-1">&nbsp;</div>Date</td>
            </tr>
          </tbody>
        </table>
      </div>
    </FormPage>
  )
}

export default Form9