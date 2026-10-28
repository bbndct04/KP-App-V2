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
        <li>There has been a personal confrontation between the parties before the Punong Barangay but mediation failed;</li>
        <li>The Pangkat ng Tagapagkasundo was constituted but the personal confrontation before the Pangkat likewise did not result into a settlement; and</li>
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

export default function Form21() {
  return <DocumentPage formNo={21} title="Certification to File Action (No Settlement)" makeDefaults={plain} Body={Body} />
}
