import DocumentPage from '../../../components/forms/DocumentPage'
import { plain } from '../../../components/forms/defaults'
import { Check, D, Footnote, FormTitle, OfficeHeader, Para, PartyCaption, Pick, Ruled, Sig, SignRow, T } from '../../../components/forms/blocks'

function Body() {
  return (
    <>
      <OfficeHeader />
      <PartyCaption />
      <FormTitle>REPUDIATION</FormTitle>
      <Para>
        I/WE hereby repudiate the <Pick k="what" label="What is repudiated" options={['settlement', 'agreement for arbitration']} /> on the ground that my/our consent was vitiated by:
      </Para>
      <Check k="fraud" label="Fraud">
        Fraud. (State details)
        <Ruled k="fraudDetails" label="Details of fraud" lines={2} />
      </Check>
      <Check k="violence" label="Violence">
        Violence. (State details)
        <Ruled k="violenceDetails" label="Details of violence" lines={2} />
      </Check>
      <Check k="intimidation" label="Intimidation">
        Intimidation. (State details)
        <Ruled k="intimidationDetails" label="Details of intimidation" lines={2} />
      </Check>
      <Para>
        This <D k="issueDate" label="Date" />.
      </Para>
      <SignRow labels={[{ label: 'Complainant/s', nameKey: 'complainant' }, { label: 'Respondent/s', nameKey: 'respondent' }]} />
      <div className="kp-avoid" style={{ marginTop: 24 }}>
        SUBSCRIBED AND SWORN TO before me this <D k="swornDate" label="Date sworn" /> at <T k="place" label="Place" underline minCh={14} />.
        <Sig
          label={<Pick k="signerRole" label="Sworn before" options={['Punong Barangay', 'Pangkat Chairman', 'Pangkat Member']} />}
          nameKey="signer"
          nameLabel="Name of officer"
          align="right"
        />
      </div>
      <div className="kp-avoid" style={{ marginTop: 18 }}>
        Received and filed * this <D k="filedDate" label="Date received and filed" />.
        <Sig label="Punong Barangay" nameKey="punongBarangay" nameLabel="Punong Barangay name" align="right" />
      </div>
      <Footnote>
        * Failure to repudiate the settlement or the arbitration agreement within the time limits respectively set (ten [10] days from the date of settlement and five [5] days from the
        date of arbitration agreement) shall be deemed a waiver of the right to challenge on said grounds.
      </Footnote>
    </>
  )
}

export default function Form17() {
  return <DocumentPage formNo={17} title="Repudiation" makeDefaults={plain} Body={Body} />
}
