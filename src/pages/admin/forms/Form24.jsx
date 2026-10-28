import DocumentPage from '../../../components/forms/DocumentPage'
import { plain } from '../../../components/forms/defaults'
import { D, Footnote, FormTitle, OfficeHeader, Para, PartyCaption, Pick, Sig, T } from '../../../components/forms/blocks'

function Body() {
  return (
    <>
      <OfficeHeader />
      <PartyCaption />
      <FormTitle>CERTIFICATION TO BAR COUNTERCLAIM</FormTitle>
      <Para>
        This is to certify that after prior notice and hearing, the respondent/s <T k="party1" label="First respondent" underline minCh={14} /> (name) and <T k="party2" label="Second respondent" underline minCh={14} /> (name) have been found to have willfully failed or refused to appear without justifiable reason before the <Pick k="forum" label="Before whom" options={['Punong Barangay', 'Pangkat ng Tagapagkasundo']} /> and therefore respondent/s is/are barred from filing his/their counterclaim (if any) arising from the complaint in court/government office.
      </Para>
      <div className="kp-avoid">
        This <D k="issueDate" label="Date of issue" />.
        <Sig label={<Pick k="certifierRole" label="Certified by" options={['Lupon Secretary', 'Pangkat Secretary']} />} nameKey="certifier" nameLabel="Name of certifying secretary" />
      </div>
      <div className="kp-avoid" style={{ marginTop: 18 }}>
        Attested:
        <Sig label={<Pick k="attesterRole" label="Attested by" options={['Lupon Chairman', 'Pangkat Chairman']} />} nameKey="attester" nameLabel="Name of attesting chairman" />
      </div>
      <Footnote>
        IMPORTANT: If Lupon Secretary makes the certification, the Lupon Chairman attests. If the Pangkat Secretary makes the certification, the Pangkat Chairman attests.
      </Footnote>
    </>
  )
}

export default function Form24() {
  return <DocumentPage formNo={24} title="Certification to Bar Counterclaim" makeDefaults={plain} Body={Body} />
}
