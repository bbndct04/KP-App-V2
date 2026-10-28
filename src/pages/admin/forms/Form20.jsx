import DocumentPage from '../../../components/forms/DocumentPage'
import { repudiationDefaults } from '../../../components/forms/defaults'
import { D, FormTitle, OfficeHeader, Para, PartyCaption, Pick, Sig, T } from '../../../components/forms/blocks'

function Body() {
  return (
    <>
      <OfficeHeader />
      <PartyCaption />
      <FormTitle>CERTIFICATION TO FILE ACTION</FormTitle>
      <Para>This is to certify that:</Para>
      <ol className="kp-list">
        <li>
          There has been a personal confrontation between the parties before the <Pick k="forum" label="Before whom" options={['Punong Barangay', 'Pangkat ng Tagapagkasundo']} />;
        </li>
        <li>A settlement was reached;</li>
        <li>
          The settlement has been repudiated in a statement sworn to before the Punong Barangay by <T k="repudiatedBy" label="Party who repudiated" underline minCh={16} /> on ground of{' '}
          <T k="repudiationGround" label="Ground of repudiation" underline minCh={16} />; and
        </li>
        <li>Therefore, the corresponding complaint for the dispute may now be filed in court/government office.</li>
      </ol>
      <div className="kp-avoid">
        This <D k="issueDate" label="Date of issue" />.
        <Sig label="Lupon Secretary" nameKey="luponSecretary" nameLabel="Lupon Secretary name" />
      </div>
      <div className="kp-avoid" style={{ marginTop: 18 }}>
        Attested:
        <Sig label="Lupon Chairman" nameKey="punongBarangay" nameLabel="Lupon Chairman name" />
      </div>
    </>
  )
}

export default function Form20() {
  return <DocumentPage formNo={20} title="Certification to File Action (Repudiated Settlement)" makeDefaults={repudiationDefaults} Body={Body} />
}
