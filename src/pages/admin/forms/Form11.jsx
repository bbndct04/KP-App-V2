import DocumentPage from '../../../components/forms/DocumentPage'
import { plain } from '../../../components/forms/defaults'
import { D, FormTitle, OfficeHeader, Para, PartyCaption, Pick, Sig, T } from '../../../components/forms/blocks'

function Body() {
  return (
    <>
      <OfficeHeader />
      <PartyCaption />
      <FormTitle>NOTICE TO CHOSEN PANGKAT MEMBER</FormTitle>
      <div className="kp-right">
        <D k="issueDate" label="Date of issue" />
      </div>
      <Para>
        TO: <T k="member" label="Pangkat member name" underline minCh={24} />
      </Para>
      <Para>
        Notice is hereby given that you have been chosen member of the Pangkat ng Tagapagkasundo to amicably conciliate the dispute between the parties in the above-entitled case.
      </Para>
      <Sig label={<Pick k="signerRole" label="Signed by" options={['Punong Barangay', 'Lupon Secretary']} />} nameKey="signer" nameLabel="Name of signatory" align="right" />
      <Para>
        Received this <D k="receivedDate" label="Date received" />.
      </Para>
      <Sig label="Pangkat Member" nameKey="member" nameLabel="Pangkat member name" />
    </>
  )
}

export default function Form11() {
  return <DocumentPage formNo={11} title="Notice to Chosen Pangkat Member" makeDefaults={plain} Body={Body} />
}
