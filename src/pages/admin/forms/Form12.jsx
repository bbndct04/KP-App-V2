import DocumentPage from '../../../components/forms/DocumentPage'
import { withHearing } from '../../../components/forms/defaults'
import { D, FormTitle, OfficeHeader, Para, PartyCaption, Pick, Sig, SignRow, T } from '../../../components/forms/blocks'

function Body() {
  return (
    <>
      <OfficeHeader office="OFFICE OF THE PUNONG BARANGAY" />
      <PartyCaption />
      <FormTitle>NOTICE OF HEARING</FormTitle>
      <div className="kp-subtitle">(CONCILIATION PROCEEDINGS)</div>
      <Para>
        You are hereby required to appear before the Pangkat on the <D k="hearingDate" label="Hearing date" /> at <T k="hearingTime" label="Hearing time" underline minCh={5} /> o&apos;clock in
        the <Pick k="hearingPeriod" label="Morning or afternoon" options={['morning', 'afternoon']} /> for a hearing of the above-entitled case.
      </Para>
      <div className="kp-avoid">
        This <D k="issueDate" label="Date of issue" />.
        <Sig label="Pangkat Chairman" nameKey="pangkatChairman" nameLabel="Pangkat Chairman name" align="right" />
      </div>
      <Para>
        Notified this <D k="notifiedDate" label="Date notified" />.
      </Para>
      <SignRow labels={[{ label: 'Complainant/s', nameKey: 'complainant' }, { label: 'Respondent/s', nameKey: 'respondent' }]} />
    </>
  )
}

export default function Form12() {
  return <DocumentPage formNo={12} title="Notice of Hearing (Conciliation)" makeDefaults={withHearing} Body={Body} />
}
