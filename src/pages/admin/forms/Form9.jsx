import DocumentPage from '../../../components/forms/DocumentPage'
import { defaults9 } from '../../../components/forms/defaults'
import { D, FormTitle, OfficeHeader, Para, PartyCaption, Sig, T } from '../../../components/forms/blocks'

const blankLine = <div style={{ borderBottom: '1px solid #000', height: 26 }} />

function Body() {
  return (
    <>
      <OfficeHeader />
      <PartyCaption />
      <FormTitle>SUMMONS</FormTitle>

      <Para>
        TO: <T k="respondent" label="Respondent name" underline /> <T k="respondentAddress" label="Respondent address" underline minCh={16} />
        <span className="kp-center kp-label" style={{ display: 'block' }}>Respondents</span>
      </Para>

      <Para>
        You are hereby summoned to appear before me in person, together with your witnesses, on the <D k="hearingDate" label="Hearing date" /> at{' '}
        <T k="hearingTime" label="Hearing time" underline minCh={5} /> o'clock in the <T k="hearingPeriod" label="Morning or afternoon" underline minCh={9} />, then and there to
        answer to a complaint made before me, copy of which is attached hereto, for mediation/conciliation of your dispute with complainant/s.
      </Para>

      <Para>
        You are hereby warned that if you refuse or willfully fail to appear in obedience to this summons, you may be barred from filing any counterclaim arising from said
        complaint.
      </Para>

      <Para bold>FAIL NOT or else face punishment as for contempt of court.</Para>

      <div className="kp-avoid">
        This <D k="issueDate" label="Date of issue" />.
        <Sig label="Punong Barangay/Pangkat Chairman" nameKey="punongBarangay" nameLabel="Punong Barangay name" />
      </div>

      <div className="kp-break">
        <FormTitle>OFFICER'S RETURN</FormTitle>
        <Para>
          I served this summons upon respondent <T k="respondent" label="Respondent name" underline /> on the <D k="servedDate1" label="Date served on first respondent" />, and upon respondent{' '}
          <T k="servedName2" label="Second respondent name" underline minCh={18} /> on the <D k="servedDate2" label="Date served on second respondent" />, by:
        </Para>
        <Para>(Write name/s of respondent/s before mode by which he/they was/were served.)</Para>
        <Para>Respondent/s</Para>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 20 }}>
          <div>
            {blankLine}1.
            {blankLine}2.
            {blankLine}3.
            {blankLine}4.
          </div>
          <div className="kp-small">
            handing to him/them said summons in person, or
            <br />
            handing to him/them said summons and he/they refused to receive it, or
            <br />
            leaving said summons at his/their dwelling with <T k="leftWith1" label="Person the summons was left with" underline minCh={14} /> (name) a person of suitable age and discretion
            residing therein, or
            <br />
            leaving said summons at his/their office/place of business with <T k="leftWith2" label="Person in charge" underline minCh={14} /> (name) a competent person in charge thereof.
          </div>
        </div>

        <Sig label="Officer" width={200} />

        <Para>Received by Respondent/s representative/s:</Para>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          <div>{blankLine}<div className="kp-label">Signature</div></div>
          <div>{blankLine}<div className="kp-label">Date</div></div>
          <div>{blankLine}<div className="kp-label">Signature</div></div>
          <div>{blankLine}<div className="kp-label">Date</div></div>
        </div>
      </div>
    </>
  )
}

function Form9() {
  return <DocumentPage formNo={9} title="Summons" makeDefaults={defaults9} Body={Body} />
}

export default Form9
