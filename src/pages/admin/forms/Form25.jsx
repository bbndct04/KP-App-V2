import DocumentPage from '../../../components/forms/DocumentPage'
import { plain } from '../../../components/forms/defaults'
import { D, FormTitle, OfficeHeader, Para, PartyCaption, Pick, Sig } from '../../../components/forms/blocks'

const MOVANT = ['Complainant/s', 'Respondent/s']

function Body() {
  return (
    <>
      <OfficeHeader />
      <PartyCaption />
      <FormTitle>MOTION FOR EXECUTION</FormTitle>
      <Para>
        <Pick k="movant" label="Who is filing" options={MOVANT} /> state as follows:
      </Para>
      <ol className="kp-list">
        <li>
          On the <D k="settledDate" label="Date of settlement or award" /> the parties in this case{' '}
          <Pick
            k="basis"
            label="Basis"
            options={['signed an amicable settlement', 'received the arbitration award rendered by the Lupon Chairman/Pangkat ng Tagapagkasundo']}
          />
          ;
        </li>
        <li>
          The period of ten (10) days from the above-stated date has expired without any of the parties filing a sworn statement of repudiation of the settlement before the Lupon
          Chairman or a petition for nullification of the arbitration award in court; and
        </li>
        <li>
          The <Pick k="what" label="Settlement or award" options={['amicable settlement', 'arbitration award']} /> is now final and executory.
        </li>
      </ol>
      <Para>
        WHEREFORE, <Pick k="movant" label="Who is filing" options={MOVANT} /> request that the corresponding writ of execution be issued by the Lupon Chairman in this case.
      </Para>
      <div className="kp-avoid">
        <D k="issueDate" label="Date" />
        <Sig label={<Pick k="movant" label="Who is filing" options={MOVANT} />} nameKey="movantName" nameLabel="Name of movant" align="right" />
      </div>
    </>
  )
}

export default function Form25() {
  return <DocumentPage formNo={25} title="Motion for Execution" makeDefaults={plain} Body={Body} />
}
