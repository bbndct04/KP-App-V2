import { useComplaintForForm, FormPage, FormHeader, PartiesTable } from './FormShell'

function Form22() {
  const { complaint, loading } = useComplaintForForm()
  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!complaint) return <div className="p-10 text-center">Complaint not found.</div>

  return (
    <FormPage>
      <FormHeader />
      <PartiesTable complaint={complaint} />

      <div className="font-bold text-[13px] uppercase text-center my-4">CERTIFICATION TO FILE ACTION</div>

      <div className="my-2.5">This is to certify that:</div>

      <ol className="leading-loose list-decimal pl-6">
        <li>There was a personal confrontation between the parties before the Punong Barangay but mediation failed;</li>
        <li>The Punong Barangay set the meeting of the parties for the constitution of the Pangkat;</li>
        <li>The respondent willfully failed or refused to appear without justifiable reason at the conciliation proceedings before the Pangkat; and</li>
        <li>Therefore, the corresponding complaint for the dispute may now be filed in court/government office.</li>
      </ol>

      <div className="mt-8">
        <div className="border-b border-black w-[220px] mb-1">&nbsp;</div>
        Pangkat Secretary
        <br /><br />
        Attested by:
        <div className="border-b border-black w-[220px] mt-5 mb-1">&nbsp;</div>
        Pangkat Chairman
      </div>
    </FormPage>
  )
}

export default Form22