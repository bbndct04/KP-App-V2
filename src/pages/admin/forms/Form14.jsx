import DocumentPage from '../../../components/forms/DocumentPage'
import { plain } from '../../../components/forms/defaults'
import { D, FormTitle, OfficeHeader, Para, PartyCaption, Pick, Sig, SignRow } from '../../../components/forms/blocks'

function Body() {
  return (
    <>
      <OfficeHeader />
      <PartyCaption />
      <FormTitle>AGREEMENT FOR ARBITRATION</FormTitle>
      <Para>
        We hereby agree to submit our dispute for arbitration to the <Pick k="arbiter" label="Arbitrator" options={['Punong Barangay', 'Pangkat ng Tagapagkasundo']} /> and bind ourselves to
        comply with the award that may be rendered thereon. We have made this agreement freely with a full understanding of its nature and consequences.
      </Para>
      <Para>
        Entered into this <D k="issueDate" label="Date entered into" />.
      </Para>
      <SignRow labels={[{ label: 'Complainant/s', nameKey: 'complainant' }, { label: 'Respondent/s', nameKey: 'respondent' }]} />
      <div className="kp-avoid">
        <FormTitle>ATTESTATION</FormTitle>
        <Para>
          I hereby certify that the foregoing Agreement for Arbitration was entered into by the parties freely and voluntarily, after I had explained to them the nature and the
          consequences of such agreement.
        </Para>
        <Sig label={<Pick k="signerRole" label="Signed by" options={['Punong Barangay', 'Pangkat Chairman']} />} nameKey="signer" nameLabel="Name of signatory" align="right" />
      </div>
    </>
  )
}

export default function Form14() {
  return <DocumentPage formNo={14} title="Agreement for Arbitration" makeDefaults={plain} Body={Body} />
}
