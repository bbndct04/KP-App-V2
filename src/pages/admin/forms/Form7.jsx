import DocumentPage from '../../../components/forms/DocumentPage'
import { defaults7 } from '../../../components/forms/defaults'
import { D, FormTitle, OfficeHeader, Para, PartyCaption, Ruled, Sig } from '../../../components/forms/blocks'

function Body() {
  return (
    <>
      <OfficeHeader />
      <PartyCaption />
      <FormTitle>COMPLAINT</FormTitle>

      <Para>I/WE hereby complain against above named respondent/s for violating my/our rights and interests in the following manner:</Para>
      <Ruled k="narrative" label="Complaint details" lines={4} />

      <Para>THEREFORE, I/WE pray that the following relief/s be granted to me/us in accordance with law and/or equity:</Para>
      <Ruled k="relief" label="Relief requested" lines={3} />

      <div className="kp-avoid">
        Made this <D k="madeDate" label="Date the complaint was made" />.
      </div>
      <Sig label="Complainant/s" />

      <div className="kp-avoid" style={{ marginTop: 26 }}>
        Received and filed this <D k="filedDate" label="Date received and filed" />.
        <Sig label="Punong Barangay/Lupon Chairman" nameKey="punongBarangay" nameLabel="Punong Barangay name" />
      </div>
    </>
  )
}

function Form7() {
  return <DocumentPage formNo={7} title="Complaint" makeDefaults={defaults7} Body={Body} />
}

export default Form7
