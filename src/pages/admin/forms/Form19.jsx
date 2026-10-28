import DocumentPage from '../../../components/forms/DocumentPage'
import { withHearing } from '../../../components/forms/defaults'
import { D, FormTitle, OfficeHeader, Para, PartyCaption, Pick, Sig, SignRow, T, ToBlock } from '../../../components/forms/blocks'

function Body() {
  return (
    <>
      <OfficeHeader />
      <PartyCaption />
      <FormTitle>NOTICE OF HEARING</FormTitle>
      <div className="kp-subtitle">(RE: FAILURE TO APPEAR)</div>
      <ToBlock left={{ k: 'respondent', label: 'Respondent/s' }} />
      <Para>
        You are hereby required to appear before <Pick k="before" label="Appear before" options={['me', 'the Pangkat']} /> on the <D k="hearingDate" label="Hearing date" /> at{' '}
        <T k="hearingTime" label="Hearing time" underline minCh={5} /> o&apos;clock in the <Pick k="hearingPeriod" label="Morning or afternoon" options={['morning', 'afternoon']} /> to explain why you
        failed to appear for <Pick k="proceeding" label="Proceeding missed" options={['mediation', 'conciliation']} /> scheduled on the <D k="missedDate" label="Date of the missed hearing" /> and
        why your counterclaim (if any) arising from the complaint should not be dismissed, a certificate to bar the filing of said counterclaim in court/government office should not be issued, and contempt proceedings should not be initiated in court for willful failure or refusal to appear before the <Pick k="forum" label="Before whom" options={['Punong Barangay', 'Pangkat ng Tagapagkasundo']} />.
      </Para>
      <div className="kp-avoid">
        This <D k="issueDate" label="Date of issue" />.
        <Sig label={<Pick k="signerRole" label="Signed by" options={['Punong Barangay', 'Pangkat Chairman']} />} nameKey="signer" nameLabel="Name of signatory" align="right" />
      </div>
      <Para>
        Notified this <D k="notifiedDate" label="Date notified" />.
      </Para>
      <SignRow labels={[{ label: 'Respondent/s', nameKey: 'respondent' }, { label: 'Complainant/s', nameKey: 'complainant' }]} />
    </>
  )
}

export default function Form19() {
  return <DocumentPage formNo={19} title="Notice of Hearing (Respondent Failure to Appear)" makeDefaults={withHearing} Body={Body} />
}
