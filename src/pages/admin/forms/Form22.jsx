import DocumentPage from '../../../components/forms/DocumentPage'
import { plain } from '../../../components/forms/defaults'
import { D, FormTitle, OfficeHeader, Para, PartyCaption, Sig } from '../../../components/forms/blocks'

function Body() {
  return (
    <>
      <OfficeHeader />
      <PartyCaption />
      <FormTitle>CERTIFICATION TO FILE ACTION</FormTitle>
      <Para>This is to certify that:</Para>
      <ol className="kp-list">
        <li>There was a personal confrontation between the parties before the Punong Barangay but mediation failed;</li>
        <li>The Punong Barangay set the meeting of the parties for the constitution of the Pangkat;</li>
        <li>The respondent willfully failed or refused to appear without justifiable reason at the conciliation proceedings before the Pangkat; and</li>
        <li>Therefore, the corresponding complaint for the dispute may now be filed in court/government office.</li>
      </ol>
      <div className="kp-avoid">
        This <D k="issueDate" label="Date of issue" />.
        <Sig label="Pangkat Secretary" nameKey="pangkatSecretary" nameLabel="Pangkat Secretary name" />
      </div>
      <div className="kp-avoid" style={{ marginTop: 18 }}>
        Attested by:
        <Sig label="Pangkat Chairman" nameKey="pangkatChairman" nameLabel="Pangkat Chairman name" />
      </div>
    </>
  )
}

export default function Form22() {
  return <DocumentPage formNo={22} title="Certification to File Action (Respondent Did Not Appear)" makeDefaults={plain} Body={Body} />
}
