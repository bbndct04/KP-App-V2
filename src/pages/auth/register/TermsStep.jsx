import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdArrowDownward, MdCheckCircle, MdOutlineDescription } from 'react-icons/md'

const TERMS = [
  [
    'Acceptance of Terms',
    'By creating an account in the Katarungang Pambarangay App (KP App) of Barangay New Kababae, Olongapo City, you agree to be bound by these Terms and Conditions. If you do not agree, do not proceed with the registration.',
  ],
  [
    'Eligibility',
    'Registration is open only to residents of Barangay New Kababae who are at least eighteen (18) years of age. Each person may register only one (1) account. Accounts may not be created for, or on behalf of, another person.',
  ],
  [
    'Purpose of the System',
    'The KP App allows residents to file complaints covered by the Katarungang Pambarangay law (Republic Act No. 7160, Sections 399–422), monitor the status of their cases, and receive notices from the Lupong Tagapamayapa. Filing a complaint online does not replace personal appearance. You must still appear at the Barangay Hall when required, including for mediation, conciliation and arbitration proceedings.',
  ],
  [
    'Identity Verification',
    'You are required to submit a photo of one (1) valid primary government-issued ID and a live photo of your face. These will be reviewed by authorized barangay officials to confirm your identity before your complaint is accepted. Submitting another person’s ID or photo is strictly prohibited.',
  ],
  [
    'Account Security',
    'You are responsible for keeping your password confidential and for all activities done under your account. Barangay officials will never ask for your password. Report any unauthorized use of your account to the Barangay Hall immediately.',
  ],
  [
    'Obligations of the User',
    'You agree to provide information that is true, accurate and complete; to refrain from filing false, malicious, or repetitive complaints; and not to use the system to harass, threaten, or defame any person. False statements may result in liability under applicable Philippine laws.',
  ],
  [
    'Restriction and Termination of Accounts',
    'The Barangay may restrict (prohibit the filing of new complaints) or block (prohibit all access to) any account that violates these Terms and Conditions. The account holder will be informed of the reason and may raise concerns at the Barangay Hall.',
  ],
  [
    'Limitation of Liability',
    'The KP App is provided to make barangay services more accessible. The Barangay does not guarantee uninterrupted availability of the system and shall not be liable for delays caused by technical issues beyond its control. Information in the app is not legal advice.',
  ],
  ['Amendments', 'The Barangay may amend these Terms and Conditions at any time. Significant changes will be announced through the app. Continued use of the app means acceptance of the amended terms.'],
  ['Governing Law', 'These Terms and Conditions are governed by the laws of the Republic of the Philippines.'],
]

const PRIVACY = [
  [
    'Personal Information Controller',
    'Barangay New Kababae, Olongapo City, through its Lupong Tagapamayapa, is the Personal Information Controller of the data collected through the KP App. Inquiries may be directed to the Barangay Secretary at the Barangay Hall.',
  ],
  [
    'Personal Information Collected',
    'Full name, date of birth, sex, home address, mobile number and email address; photos of the front and back of your government-issued ID; a live photo of your face; the complaints you file and related case records; and system logs such as log-in times and actions made by officials on your account.',
  ],
  [
    'Purpose of Processing',
    'Your personal information will be processed to (a) verify your identity and eligibility; (b) receive, process and resolve complaints under the Katarungang Pambarangay law; (c) issue summons, notices and other KP forms; (d) send updates about your case; and (e) keep official barangay records as required by law.',
  ],
  [
    'Disclosure and Sharing',
    'Your information may be accessed only by authorized barangay officials and Lupon members handling your case. The opposing party will only receive the information required by the KP process, such as your name in a summons. Records may be released to courts or government offices only when required by law or upon your written request. Your data will never be sold.',
  ],
  [
    'Storage, Security and Retention',
    'Your data is stored in secured servers with access limited by role. ID and face photos are kept in private storage, and every viewing by an official is recorded. Records are retained for as long as your account is active and as required by applicable records management rules.',
  ],
  [
    'Rights of the Data Subject',
    'Under the Data Privacy Act of 2012, you have the right to be informed, to access, to object, to erasure or blocking, to rectification, to data portability, and to be indemnified for damages. You may also file a complaint with the National Privacy Commission (www.privacy.gov.ph).',
  ],
]

function Section({ items, start = 1 }) {
  return (
    <ol className="flex flex-col gap-3.5">
      {items.map(([title, text], i) => (
        <li key={title}>
          <div className="text-ink font-semibold text-[13.5px] mb-0.5">
            {start + i}. {title}
          </div>
          <p className="text-ink-soft text-[13.5px] leading-relaxed sm:text-justify">{text}</p>
        </li>
      ))}
    </ol>
  )
}

function TermsStep({ onNext }) {
  const navigate = useNavigate()
  const boxRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [agree, setAgree] = useState({ terms: false, privacy: false })
  const read = progress >= 100

  function onScroll() {
    const el = boxRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    const pct = max <= 8 ? 100 : Math.min(100, Math.round((el.scrollTop / (max - 8)) * 100))
    setProgress((p) => Math.max(p, pct))
  }

  const check = (key, text) => (
    <label className={`flex items-start gap-3 ${read ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
      <input
        type="checkbox"
        checked={agree[key]}
        disabled={!read}
        onChange={(e) => setAgree((a) => ({ ...a, [key]: e.target.checked }))}
        className="mt-0.5 w-5 h-5 accent-[var(--accent)] flex-shrink-0"
      />
      <span className="text-sm text-ink leading-relaxed">{text}</span>
    </label>
  )

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-accent-soft text-accent flex items-center justify-center flex-shrink-0">
          <MdOutlineDescription className="text-2xl" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-ink text-xl sm:text-2xl font-bold leading-tight">Terms and Conditions</h2>
          <p className="text-ink-soft text-sm">Please read the entire document before you continue.</p>
        </div>
      </div>

      <div className="border border-border rounded-2xl overflow-hidden">
        <div className="h-1 bg-surface-sunken" aria-hidden="true">
          <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>
        <div
          ref={boxRef}
          onScroll={onScroll}
          tabIndex={0}
          aria-label="Terms and Conditions and Data Privacy Notice"
          className="max-h-[48vh] min-h-[280px] overflow-y-auto px-5 py-5 bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <div className="text-center mb-5">
            <div className="text-ink-faint text-[11px] font-semibold uppercase tracking-[0.14em]">Barangay New Kababae · Olongapo City</div>
            <div className="text-ink font-bold text-[15px] mt-1">KATARUNGANG PAMBARANGAY APP</div>
            <div className="text-ink-faint text-xs">Effective November 2026</div>
          </div>

          <div className="text-ink font-bold text-sm uppercase tracking-wide mb-3 pb-2 border-b border-border">Part I · Terms and Conditions of Use</div>
          <Section items={TERMS} />

          <div className="text-ink font-bold text-sm uppercase tracking-wide mt-7 mb-3 pb-2 border-b border-border">
            Part II · Data Privacy Notice (Republic Act No. 10173)
          </div>
          <Section items={PRIVACY} />

          <div className="mt-7 rounded-xl bg-surface-sunken border border-border p-4">
            <div className="text-ink font-bold text-sm mb-1">Consent</div>
            <p className="text-ink-soft text-[13.5px] leading-relaxed sm:text-justify">
              I have read and understood these Terms and Conditions and the Data Privacy Notice. I voluntarily give my consent to Barangay New Kababae to collect,
              use, store and process my personal information for the purposes stated above, in accordance with the Data Privacy Act of 2012.
            </p>
          </div>
        </div>
        <div
          className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 border-t border-border ${
            read ? 'bg-success-soft text-success-strong' : 'bg-surface-sunken text-ink-soft'
          }`}
        >
          {read ? (
            <span className="flex items-center gap-1.5">
              <MdCheckCircle className="text-base" aria-hidden="true" /> You have read the entire document
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <MdArrowDownward className="text-base animate-bounce" aria-hidden="true" /> Scroll to the end to continue
            </span>
          )}
          <span className="tabular-nums">{progress}%</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-5">
        {check('terms', 'I have read and agree to the Terms and Conditions.')}
        {check('privacy', 'I consent to the collection and processing of my personal information as stated in the Data Privacy Notice.')}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="border border-border rounded-xl py-3 text-sm font-semibold text-ink-soft hover:bg-surface-hover"
        >
          I Disagree
        </button>
        <button
          type="button"
          disabled={!read || !agree.terms || !agree.privacy}
          onClick={onNext}
          className="bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-accent-ink font-semibold text-sm rounded-xl py-3 shadow-token-md"
        >
          I Agree
        </button>
      </div>
    </>
  )
}

export default TermsStep
