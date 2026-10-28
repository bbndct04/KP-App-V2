import DocumentPage from '../../../components/forms/DocumentPage'
import { withHearing } from '../../../components/forms/defaults'
import { D, FormTitle, OfficeHeader, Para, PartyCaption, Pick, Sig, T, ToBlock } from '../../../components/forms/blocks'

function Body() {
  return (
    <>
      <OfficeHeader />
      <PartyCaption />
      <FormTitle>SUBPOENA</FormTitle>
      <ToBlock left={{ k: 'witness1', label: 'Witnesses', fieldLabel: 'First witness' }} right={{ k: 'witness2', label: 'Witnesses ', fieldLabel: 'Second witness' }} />
      <Para>
        You are hereby commanded to appear before me on the <D k="hearingDate" label="Hearing date" /> at <T k="hearingTime" label="Hearing time" underline minCh={5} /> o&apos;clock, then and
        there to testify in the hearing of the above-captioned case.
      </Para>
      <div className="kp-avoid">
        This <D k="issueDate" label="Date of issue" />.
        <Sig label={<Pick k="signerRole" label="Signed by" options={['Punong Barangay', 'Pangkat Chairman']} />} nameKey="signer" nameLabel="Name of signatory" align="right" />
      </div>
    </>
  )
}

export default function Form13() {
  return <DocumentPage formNo={13} title="Subpoena" makeDefaults={withHearing} Body={Body} />
}
