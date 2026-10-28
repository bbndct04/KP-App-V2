import DocumentPage from '../../../components/forms/DocumentPage'
import { settlementDefaults } from '../../../components/forms/defaults'
import { D, FormTitle, OfficeHeader, Para, PartyCaption, Pick, Ruled, Sig, SignRow, T } from '../../../components/forms/blocks'

function Body() {
  return (
    <>
      <OfficeHeader />
      <PartyCaption />
      <FormTitle>NOTICE OF EXECUTION</FormTitle>
      <Para>
        WHEREAS, on the <D k="settledDate" label="Date of settlement or award" />,{' '}
        <Pick
          k="basis"
          label="Basis"
          options={['an amicable settlement was signed by the parties in the above-entitled case', 'an arbitration award was rendered by the Punong Barangay/Pangkat ng Tagapagkasundo']}
        />
        ;
      </Para>
      <Para>WHEREAS, the terms and conditions of the settlement, the dispositive portion of the award, read:</Para>
      <Ruled k="terms" label="Terms of the settlement or award" lines={4} />
      <Para>The said settlement/award is now final and executory;</Para>
      <Para>
        WHEREAS, the party obliged <T k="obligedParty" label="Party obliged" underline minCh={16} /> (name) has not complied voluntarily with the aforestated amicable settlement/arbitration
        award, within the period of five (5) days from the date of hearing on the motion for execution;
      </Para>
      <Para>
        NOW, THEREFORE, in behalf of the Lupong Tagapamayapa and by virtue of the powers vested in me and the Lupon by the Katarungang Pambarangay Law and Rules, I shall cause to be
        realized from the goods and personal property of <T k="obligedParty" label="Party obliged" underline minCh={16} /> (name of party obliged) the sum of{' '}
        <T k="amount" label="Amount of settlement or award" underline minCh={14} /> (state amount of settlement or award) agreed upon in the said amicable settlement [or adjudged in the said
        arbitration award], unless voluntary compliance of said settlement or award shall have been made upon receipt hereof.
      </Para>
      <div className="kp-avoid">
        Signed this <D k="issueDate" label="Date signed" />.
        <Sig label="Punong Barangay" nameKey="punongBarangay" nameLabel="Punong Barangay name" align="right" />
      </div>
      <Para>Copy furnished:</Para>
      <SignRow labels={[{ label: 'Complainant/s', nameKey: 'complainant' }, { label: 'Respondent/s', nameKey: 'respondent' }]} />
    </>
  )
}

export default function Form27() {
  return <DocumentPage formNo={27} title="Notice of Execution" makeDefaults={settlementDefaults} Body={Body} />
}
