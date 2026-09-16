import { useComplaintForForm, fmtDate, FormPage, FormHeader, PartiesTable } from './FormShell'

function Form20() {
  const { complaint, loading } = useComplaintForForm()
  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!complaint) return <div className="p-10 text-center">Complaint not found.</div>

  const now = new Date()

  return (
    <FormPage>
      <FormHeader />
      <PartiesTable complaint={complaint} />

      <div className="font-bold text-[13px] uppercase text-center my-4">CERTIFICATION TO FILE ACTION</div>

      <div className="my-2.5">This is to certify that:</div>

      <ol className="leading-loose list-decimal pl-6">
        <li>There has been a personal confrontation between the parties before the Punong Barangay/Pangkat ng Tagapagkasundo;</li>
        <li>A settlement was reached;</li>
        <li>
          The settlement has been repudiated in a statement sworn to before the
          Punong Barangay by <u>{complaint.cfa_reason?.match(/Repudiated by: (.+)\)/)?.[1] || '______________'}</u> on
          ground of <u>{complaint.cfa_reason?.split(' (Repudiated')[0] || '______________'}</u>; and
        </li>
        <li>Therefore, the corresponding complaint for the dispute may now be filed in court/government office.</li>
      </ol>

      <div className="text-justify leading-loose my-2.5">
        This <u>{fmtDate(now, 'day')}</u> day of <u>{fmtDate(now, 'month')}</u>, <u>{fmtDate(now, 'year')}</u>.
      </div>

      <div className="border-b border-black w-[220px] mt-5 mb-1">&nbsp;</div>
      Lupon Secretary
      <br /><br />
      Attested:
      <div className="border-b border-black w-[220px] mt-5 mb-1">&nbsp;</div>
      Lupon Chairman
    </FormPage>
  )
}

export default Form20