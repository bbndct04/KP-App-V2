import DocumentPage from '../../../components/forms/DocumentPage'
import { plain } from '../../../components/forms/defaults'
import { D, Footnote, FormTitle, OfficeHeader, Para, PartyCaption, Pick, Ruled, Sig, T } from '../../../components/forms/blocks'

function Body() {
  return (
    <>
      <OfficeHeader />
      <PartyCaption />
      <FormTitle>ARBITRATION AWARD</FormTitle>
      <Para>After hearing the testimonies given and careful examination of the evidence presented in this case, award is hereby made as follows:</Para>
      <Ruled k="award" label="Arbitration award" lines={4} />
      <Para>
        Made this <D k="issueDate" label="Date made" /> at <T k="place" label="Place" underline minCh={14} />.
      </Para>
      <div className="kp-avoid">
        <Sig label={<>{<Pick k="signerRole" label="Award made by" options={['Punong Barangay', 'Pangkat Chairman']} />} *</>} nameKey="signer" nameLabel="Name of signatory" />
        <Sig label="Member" nameKey="member1" nameLabel="First Pangkat member" />
        <Sig label="Member" nameKey="member2" nameLabel="Second Pangkat member" />
      </div>
      <div className="kp-avoid" style={{ marginTop: 24 }}>
        ATTESTED:
        <Sig label={<>{<Pick k="attesterRole" label="Attested by" options={['Punong Barangay', 'Lupon Secretary']} />} **</>} nameKey="attester" nameLabel="Name of attesting officer" />
      </div>
      <Footnote>
        * To be signed by either, whoever made the arbitration award.
        <br />
        ** To be signed by the Punong Barangay if the award is made by the Pangkat Chairman, and by the Lupon Secretary if the award is made by the Punong Barangay.
      </Footnote>
    </>
  )
}

export default function Form15() {
  return <DocumentPage formNo={15} title="Arbitration Award" makeDefaults={plain} Body={Body} />
}
