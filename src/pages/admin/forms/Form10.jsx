import DocumentPage from '../../../components/forms/DocumentPage'
import { withHearing } from '../../../components/forms/defaults'
import { D, FormTitle, OfficeHeader, Para, Pick, Sig, SignRow, T, ToBlock } from '../../../components/forms/blocks'

function Body() {
  return (
    <>
      <OfficeHeader office="OFFICE OF THE PUNONG BARANGAY" />
      <FormTitle>NOTICE FOR CONSTITUTION OF PANGKAT</FormTitle>
      <ToBlock left={{ k: 'complainant', label: 'Complainant/s' }} right={{ k: 'respondent', label: 'Respondent/s' }} />
      <Para>
        You are hereby required to appear before me on the <D k="hearingDate" label="Date to constitute the Pangkat" /> at <T k="hearingTime" label="Time" underline minCh={5} /> o&apos;clock in the{' '}
        <Pick k="hearingPeriod" label="Morning or afternoon" options={['morning', 'afternoon']} /> for the constitution of the Pangkat ng Tagapagkasundo which shall conciliate your dispute.
        Should you fail to agree on the Pangkat membership or to appear on the aforesaid date for the constitution of the Pangkat, I shall determine the membership thereof by
        drawing lots.
      </Para>
      <div className="kp-avoid">
        This <D k="issueDate" label="Date of issue" />.
        <Sig label="Punong Barangay" nameKey="punongBarangay" nameLabel="Punong Barangay name" align="right" />
      </div>
      <Para>
        Notified this <D k="notifiedDate" label="Date notified" />.
      </Para>
      <SignRow labels={[{ label: 'Complainant/s', nameKey: 'complainant' }, { label: 'Respondent/s', nameKey: 'respondent' }]} />
    </>
  )
}

export default function Form10() {
  return <DocumentPage formNo={10} title="Notice for Constitution of Pangkat" makeDefaults={withHearing} Body={Body} />
}
