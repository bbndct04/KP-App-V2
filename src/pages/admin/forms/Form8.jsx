import DocumentPage from '../../../components/forms/DocumentPage'
import { withHearing } from '../../../components/forms/defaults'
import { D, FormTitle, OfficeHeader, Para, Pick, Sig, SignRow, T, ToBlock } from '../../../components/forms/blocks'

function Body() {
  return (
    <>
      <OfficeHeader />
      <FormTitle>NOTICE OF HEARING</FormTitle>
      <div className="kp-subtitle">(MEDIATION PROCEEDINGS)</div>
      <ToBlock left={{ k: 'complainant', label: 'Complainant/s' }} />
      <Para>
        You are hereby required to appear before me on the <D k="hearingDate" label="Hearing date" /> at <T k="hearingTime" label="Hearing time" underline minCh={5} /> o&apos;clock in the{' '}
        <Pick k="hearingPeriod" label="Morning or afternoon" options={['morning', 'afternoon']} /> for the hearing of your complaint.
      </Para>
      <div className="kp-avoid">
        This <D k="issueDate" label="Date of issue" />.
        <Sig label="Punong Barangay/Lupon Chairman" nameKey="punongBarangay" nameLabel="Punong Barangay name" align="right" />
      </div>
      <Para>
        Notified this <D k="notifiedDate" label="Date notified" />.
      </Para>
      <SignRow labels={[{ label: 'Complainant/s', nameKey: 'complainant' }]} />
    </>
  )
}

export default function Form8() {
  return <DocumentPage formNo={8} title="Notice of Hearing (Mediation)" makeDefaults={withHearing} Body={Body} />
}
