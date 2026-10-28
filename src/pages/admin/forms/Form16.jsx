import DocumentPage from '../../../components/forms/DocumentPage'
import { settlementDefaults } from '../../../components/forms/defaults'
import { D, FormTitle, OfficeHeader, Para, PartyCaption, Pick, Ruled, Sig, SignRow } from '../../../components/forms/blocks'

function Body() {
  return (
    <>
      <OfficeHeader />
      <PartyCaption />
      <FormTitle>AMICABLE SETTLEMENT</FormTitle>
      <Para>We, complainant/s and respondent/s in the above-captioned case, do hereby agree to settle our dispute as follows:</Para>
      <Ruled k="terms" label="Terms of settlement" lines={4} />
      <Para>and bind ourselves to comply honestly and faithfully with the above terms of settlement.</Para>
      <Para>
        Entered into this <D k="issueDate" label="Date entered into" />.
      </Para>
      <SignRow labels={[{ label: 'Complainant/s', nameKey: 'complainant' }, { label: 'Respondent/s', nameKey: 'respondent' }]} />
      <div className="kp-avoid">
        <FormTitle>ATTESTATION</FormTitle>
        <Para>
          I hereby certify that the foregoing amicable settlement was entered into by the parties freely and voluntarily, after I had explained to them the nature and consequence of
          such settlement.
        </Para>
        <Sig label={<Pick k="signerRole" label="Signed by" options={['Punong Barangay', 'Pangkat Chairman']} />} nameKey="signer" nameLabel="Name of signatory" align="right" />
      </div>
    </>
  )
}

export default function Form16() {
  return <DocumentPage formNo={16} title="Amicable Settlement" makeDefaults={settlementDefaults} Body={Body} />
}
