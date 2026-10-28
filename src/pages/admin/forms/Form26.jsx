import DocumentPage from '../../../components/forms/DocumentPage'
import { withHearing } from '../../../components/forms/defaults'
import { D, FormTitle, OfficeHeader, Para, PartyCaption, Pick, Sig, SignRow, T, ToBlock } from '../../../components/forms/blocks'

function Body() {
  return (
    <>
      <OfficeHeader />
      <PartyCaption />
      <FormTitle>NOTICE OF HEARING</FormTitle>
      <div className="kp-subtitle">(RE: MOTION FOR EXECUTION)</div>
      <ToBlock left={{ k: 'complainant', label: 'Complainant/s' }} right={{ k: 'respondent', label: 'Respondent/s' }} />
      <Para>
        You are hereby required to appear before me on the <D k="hearingDate" label="Hearing date" /> at <T k="hearingTime" label="Hearing time" underline minCh={5} /> o&apos;clock in the{' '}
        <Pick k="hearingPeriod" label="Time of day" options={['morning', 'afternoon', 'evening']} /> for the hearing of the motion for execution, copy of which is attached hereto, filed by{' '}
        <T k="movantName" label="Name of complainant/s or respondent/s who filed" underline minCh={18} />.
      </Para>
      <div className="kp-avoid">
        <D k="issueDate" label="Date of issue" />
        <Sig label="Punong Barangay/Lupon Chairman" nameKey="punongBarangay" nameLabel="Punong Barangay name" align="right" />
      </div>
      <Para>
        Notified this <D k="notifiedDate" label="Date notified" />.
      </Para>
      <SignRow labels={[{ label: 'Complainant/s', nameKey: 'complainant' }, { label: 'Respondent/s', nameKey: 'respondent' }]} />
    </>
  )
}

export default function Form26() {
  return <DocumentPage formNo={26} title="Notice of Hearing (Motion for Execution)" makeDefaults={withHearing} Body={Body} />
}
