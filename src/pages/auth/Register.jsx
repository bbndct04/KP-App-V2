import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import logo from '../../assets/kp-app-logo.png'
import barangayLogo from '../../assets/barangay-newkababae-logo.jpg'

const STEP_LABELS = [
  { label: 'Terms & Privacy', sub: 'Read and agree to terms' },
  { label: 'ID Verification', sub: 'Upload your valid ID' },
  { label: 'Face Photo', sub: 'Take or upload a selfie' },
  { label: 'Your Details', sub: 'Complete your information' },
  { label: 'Create Account', sub: 'Set your password' },
]

function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [agreed, setAgreed] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const termsRef = useRef(null)

  const [idFile, setIdFile] = useState(null)
  const [idPreview, setIdPreview] = useState(null)
  const [idScanStatus, setIdScanStatus] = useState('idle')
  const [ocrDebugText, setOcrDebugText] = useState('')
  const [faceFile, setFaceFile] = useState(null)
  const [facePreview, setFacePreview] = useState(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [dob, setDob] = useState('')
  const [sex, setSex] = useState('')
  const [contact, setContact] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [step4Errors, setStep4Errors] = useState({})

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [strength, setStrength] = useState({ pct: '0%', color: '#f87171', text: '' })

  function handleTermsScroll() {
    const el = termsRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10
    if (atBottom) setScrolledToBottom(true)
  }

  function handleIDUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  setIdFile(file)
  setIdPreview(URL.createObjectURL(file))
  setIdScanStatus('scanning')

  const reader = new FileReader()
  reader.onloadend = async () => {
    const base64 = reader.result.split(',')[1]

    try {
      const { data, error } = await supabase.functions.invoke('verify-id', {
        body: { imageBase64: base64 },
      })

      if (error || !data?.text) {
        setIdScanStatus('success') // still let them proceed even if OCR found nothing
        return
      }

      const text = data.text
      setOcrDebugText(text || '(empty — OCR found no text)')
      console.log('OCR raw text:', text)

      // Very basic name extraction — looks for common ID label patterns
      const nameMatch = text.match(/(?:Name|Pangalan)[:\s]+([A-Za-z ,.'-]+)/i)
      if (nameMatch && nameMatch[1]) {
        const parts = nameMatch[1].trim().split(' ')
        if (parts.length >= 2) {
          setFirstName(parts[0])
          setLastName(parts[parts.length - 1])
        }
      }

      // Very basic date-of-birth extraction (looks for common date formats)
      const dobMatch = text.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/)
      if (dobMatch) {
        const [d, m, y] = dobMatch[1].split(/[\/\-]/)
        if (y && m && d) setDob(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
      }

      setIdScanStatus('success')
        } catch (err) {
      setOcrDebugText('ERROR: ' + err.message)
      setIdScanStatus('success')
    }
  }
  reader.readAsDataURL(file)
}

  function resetID() {
    setIdFile(null)
    setIdPreview(null)
    setIdScanStatus('idle')
  }

  function handleFaceUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setFaceFile(file)
    setFacePreview(URL.createObjectURL(file))
  }

  function resetFace() {
    setFaceFile(null)
    setFacePreview(null)
  }

  function validateStep4() {
    const errors = {}
    if (!firstName.trim()) errors.firstName = 'First name is required.'
    if (!lastName.trim()) errors.lastName = 'Last name is required.'

    if (!dob) {
      errors.dob = 'Date of birth is required.'
    } else {
      const today = new Date()
      const birth = new Date(dob)
      let age = today.getFullYear() - birth.getFullYear()
      const mDiff = today.getMonth() - birth.getMonth()
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--
      if (age < 18) errors.dob = '⚠️ You must be at least 18 years old to register.'
    }

    if (contact && !/^[0-9]{11}$/.test(contact)) {
      errors.contact = 'Enter a valid 11-digit phone number.'
    }

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      errors.email = 'Enter a valid email address.'
    }

    if (!address.trim()) errors.address = 'Address is required.'

    setStep4Errors(errors)
    if (Object.keys(errors).length === 0) setStep(5)
  }

  function handlePasswordChange(val) {
    setPassword(val)
    let s = 0
    if (val.length >= 8) s++
    if (/[A-Z]/.test(val)) s++
    if (/[0-9]/.test(val)) s++
    if (/[^A-Za-z0-9]/.test(val)) s++
    const levels = [
      { pct: '0%', color: '#f87171', text: '' },
      { pct: '25%', color: '#f87171', text: 'Weak' },
      { pct: '50%', color: '#fbbf24', text: 'Fair' },
      { pct: '75%', color: '#60a5fa', text: 'Good' },
      { pct: '100%', color: '#34d399', text: 'Strong ✓' },
    ]
    setStrength(levels[s])
  }

  async function handleSubmit() {
    setSubmitError('')

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters.')
      return
    }
    if (password !== passwordConfirm) {
      setSubmitError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`,
          middle_name: middleName || null,
          date_of_birth: dob,
          sex: sex || null,
          contact_number: contact || null,
          address,
        },
      },
    })

    if (error) {
      setSubmitError(error.message)
      setSubmitting(false)
      return
    }

    const userId = data.user?.id
    if (userId) {
      if (idFile) {
        await supabase.storage.from('id-uploads').upload(`${userId}/id.jpg`, idFile, { upsert: true })
      }
      if (faceFile) {
        await supabase.storage.from('face-uploads').upload(`${userId}/face.jpg`, faceFile, { upsert: true })
      }
    }

    setSubmitting(false)
    navigate('/login')
  }

  return (
    <div className="min-h-screen relative flex bg-blue-950 overflow-hidden">
      {/* Ambient glow background */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-500/25 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-400/15 rounded-full blur-[120px]" />

      {/* LEFT PANEL */}
      <div className="hidden md:flex w-[400px] flex-col items-center justify-center px-8 py-10 relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 bounce-1">
            <img src={logo} alt="KP App" className="w-[70px] h-[70px] rounded-full" />
          </div>
          <div className="w-px h-12 bg-white/20" />
          <div className="p-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 bounce-2">
            <img src={barangayLogo} alt="Barangay" className="w-[70px] h-[70px] rounded-full bg-white" />
          </div>
        </div>
        <h2 className="text-white font-sans text-xl font-bold mb-1 text-center">
          Katarungang Pambarangay App
        </h2>
        <p className="text-blue-200/60 font-sans text-xs mb-8 text-center">
          Barangay New Kababae, Olongapo City
        </p>

        <div className="text-left w-full max-w-[260px]">
          {STEP_LABELS.map((s, i) => {
            const num = i + 1
            const isActive = num === step
            const isDone = num < step
            return (
              <div key={num}>
                <div className={`flex items-center gap-3.5 transition-opacity ${isActive ? 'opacity-100' : isDone ? 'opacity-75' : 'opacity-40'}`}>
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 backdrop-blur-sm
                    ${isActive ? 'bg-blue-500/80 border-blue-300/50 text-white ring-4 ring-blue-400/25' : ''}
                    ${isDone ? 'bg-green-500/40 border-green-300/40 text-white' : ''}
                    ${!isActive && !isDone ? 'bg-white/5 border-white/20 text-white/70' : ''}`}>
                    {num}
                  </div>
                  <div>
                    <div className="text-white font-sans text-sm font-semibold">{s.label}</div>
                    <div className="text-white/40 font-sans text-xs">{s.sub}</div>
                  </div>
                </div>
                {num < 5 && <div className="w-0.5 h-7 bg-white/10 my-1 ml-4" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT FORM SIDE */}
      <div className="flex-1 flex justify-center px-6 md:px-12 py-10 overflow-y-auto relative z-10">
        <div className="w-full max-w-[580px] bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 ring-1 ring-white/10 shadow-2xl p-8 my-auto">

          {step === 1 && (
            <>
              <div className="mb-6">
                <h2 className="text-white font-sans text-2xl font-bold mb-1">
                  Step 1 — Terms & Privacy Policy
                </h2>
                <p className="text-blue-200/70 font-sans text-sm">
                  Please read and agree to our Terms of Service and Data Privacy Act before proceeding.
                </p>
              </div>

              <div className="border border-white/20 rounded-xl overflow-hidden mb-5 bg-white/5">
                <div className="bg-white/10 px-3.5 py-2.5 text-sm font-bold text-white border-b border-white/10">
                  Terms of Service, Data Privacy Act & Age Requirement
                </div>
                <div
                  ref={termsRef}
                  onScroll={handleTermsScroll}
                  className="p-3.5 max-h-[200px] overflow-y-auto text-[13px] text-blue-100/80 leading-relaxed space-y-2.5"
                >
                  <p><strong className="text-white">⚠️ Age Requirement</strong><br />
                  This system is exclusively for individuals who are <strong className="text-white">18 years old and above</strong>. By registering, you confirm that you are at least 18 years of age. Minors are strictly prohibited from using this system in compliance with Philippine law and the Data Privacy Act of 2012.</p>

                  <p><strong className="text-white">1. Acceptance of Terms</strong><br />
                  By registering for a Katarungang Pambarangay App (KP App) account, you agree to be bound by these Terms of Service and the Data Privacy Act of 2012 (Republic Act No. 10173). If you do not agree, please do not use this system.</p>

                  <p><strong className="text-white">2. Purpose of the System</strong><br />
                  The KP App is an official digital platform of Barangay New Kababae, Olongapo City, Zambales. It is designed to facilitate the filing, processing, and resolution of complaints following the Katarungang Pambarangay Law (RA 7160, Sections 399-422). The system is exclusively for residents of Barangay New Kababae who are 18 years old and above.</p>

                  <p><strong className="text-white">3. Data Privacy Act of 2012 (RA 10173)</strong><br />
                  In compliance with the Data Privacy Act of 2012, Barangay New Kababae, as the Personal Information Controller, hereby informs you that:<br /><br />
                  a) <strong className="text-white">Collection:</strong> We collect your personal information including your name, address, contact number, date of birth, and government-issued ID for the purpose of identity verification and account creation.<br /><br />
                  b) <strong className="text-white">Purpose:</strong> Your personal data will be used solely for processing your complaints and facilitating the Katarungang Pambarangay process.<br /><br />
                  c) <strong className="text-white">Sharing:</strong> Your data will only be shared with authorized barangay officials involved in the complaint resolution process. We will not share your data with third parties without your consent.<br /><br />
                  d) <strong className="text-white">Retention:</strong> Your personal data will be retained for the period necessary to fulfill the purposes for which it was collected, in accordance with applicable laws.<br /><br />
                  e) <strong className="text-white">Rights:</strong> You have the right to access, correct, and request deletion of your personal data. Contact the Barangay Secretary for data privacy concerns.<br /><br />
                  f) <strong className="text-white">Security:</strong> We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, disclosure, alteration, or destruction.</p>

                  <p><strong className="text-white">4. User Responsibilities</strong><br />
                  You agree to provide accurate, truthful, and complete information. Filing false, misleading, or malicious complaints is strictly prohibited and may result in account suspension and legal action under the Revised Penal Code of the Philippines.</p>

                  <p><strong className="text-white">5. ID Verification</strong><br />
                  Your government-issued ID is scanned using OCR technology only to pre-fill your registration form. The image is processed temporarily and is not permanently stored. Accepted IDs include: PhilSys National ID, Driver's License, Passport, UMID, SSS ID, and Voter's ID.</p>

                  <p><strong className="text-white">6. Age Verification</strong><br />
                  By proceeding with registration, you declare under oath that you are 18 years of age or older. Providing false information about your age is a violation of these terms and may result in legal consequences.</p>

                  <p><strong className="text-white">7. Prohibited Conduct</strong><br />
                  You must not: submit false complaints, impersonate another person, use the system for unlawful purposes, or allow minors to use your account.</p>

                  <p><strong className="text-white">8. Account Suspension</strong><br />
                  The Barangay Administrator reserves the right to suspend or terminate accounts found in violation of these terms without prior notice.</p>

                  <p><strong className="text-white">9. Consent</strong><br />
                  By checking the box below, you freely give your consent to the collection and processing of your personal data as described above, in accordance with the Data Privacy Act of 2012. You also confirm that you are 18 years of age or older.</p>
                </div>
                <div className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 ${scrolledToBottom ? 'bg-green-500/15 text-green-300' : 'bg-amber-500/15 text-amber-300'}`}>
                  {scrolledToBottom ? '✓ You can now agree to the terms' : '↓ Scroll down to read all terms before agreeing'}
                </div>
              </div>

              <div className="mb-5">
                <label className={`flex items-start gap-2.5 ${scrolledToBottom ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    disabled={!scrolledToBottom}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-blue-500 disabled:opacity-40"
                  />
                  <span className="text-[13.5px] text-blue-100/80 leading-relaxed">
                    I have read and agree to the <strong className="text-blue-300">Terms of Service</strong>, <strong className="text-blue-300">Data Privacy Act of 2012</strong>, and confirm that I am <strong className="text-blue-300">18 years old or above</strong>.
                  </span>
                </label>
                {!scrolledToBottom && (
                  <div className="text-xs text-blue-200/40 mt-1 ml-7">🔒 Scroll and read all terms above to unlock</div>
                )}
              </div>

              <button
                type="button"
                disabled={!agreed}
                onClick={() => setStep(2)}
                className="w-full bg-blue-500/90 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-sans font-semibold text-sm rounded-xl py-3 transition-all shadow-lg shadow-blue-500/30 border border-blue-400/30"
              >
                I Agree — Proceed to ID Verification ›
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-6">
                <h2 className="text-white font-sans text-2xl font-bold mb-1">
                  Step 2 — ID Verification
                </h2>
                <p className="text-blue-200/70 font-sans text-sm">
                  Upload a valid government ID. This helps verify your identity.
                </p>
              </div>

              <div
                onClick={() => document.getElementById('id-file').click()}
                className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer bg-white/5 hover:border-blue-400/50 hover:bg-white/10 transition-colors min-h-[180px] flex items-center justify-center"
              >
                <input type="file" id="id-file" accept="image/*" className="hidden" onChange={handleIDUpload} />

                {!idPreview ? (
                  <div>
                    <div className="w-[72px] h-[72px] bg-blue-500/20 border border-blue-400/30 rounded-full flex items-center justify-center mx-auto mb-3.5">
                      <svg width="32" height="32" fill="none" stroke="#93c5fd" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="10" r="1.5"/><path d="m2 15 5-5 4 4 3-3 5 5"/></svg>
                    </div>
                    <div className="text-[15px] font-bold text-white mb-1.5">Click to upload your valid ID</div>
                    <div className="text-[13px] text-blue-200/60 mb-1">PhilSys, Driver's License, Passport, UMID, Voter's ID</div>
                    <div className="text-xs text-blue-200/40">JPG, PNG — Max 10MB</div>
                  </div>
                ) : (
                  <div className="w-full">
                    <img src={idPreview} alt="ID" className="max-w-full max-h-[200px] rounded-xl object-contain mx-auto" />
                    {idScanStatus === 'scanning' && (
                      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium mt-2.5 bg-blue-500/15 text-blue-200 border border-blue-400/30">
                        <div className="w-4 h-4 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin" />
                        <span>Reading your ID — please wait...</span>
                      </div>
                    )}
                    {idScanStatus === 'success' && (
                      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium mt-2.5 bg-green-500/15 text-green-300 border border-green-400/30">
                        <span>✓</span><span>ID uploaded successfully.</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); resetID() }}
                      className="mt-2.5 border border-white/20 rounded-md px-3.5 py-1.5 text-sm text-blue-200/80"
                    >
                      Change ID
                    </button>
                     {ocrDebugText && (
                      <div className="mt-3 text-left bg-black/30 border border-white/15 rounded-lg p-3 text-xs text-blue-100/80 max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                        <strong className="text-white">OCR Debug Output:</strong><br />
                        {ocrDebugText}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <button type="button" onClick={() => setStep(1)} className="border border-white/20 rounded-lg px-5 py-2.5 text-sm text-blue-200/80">
                  ‹ Back
                </button>
                <div className="flex gap-2.5">
                  <button type="button" onClick={() => setStep(3)} className="border border-white/20 rounded-lg px-5 py-2.5 text-sm text-blue-200/80">
                    Skip — Fill manually
                  </button>
                  <button
                    type="button"
                    disabled={!idFile || idScanStatus === 'scanning'}
                    onClick={() => setStep(3)}
                    className="bg-blue-500/90 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl px-7 py-2.5 shadow-lg shadow-blue-500/30 border border-blue-400/30"
                  >
                    Next — Take Selfie ›
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="mb-6">
                <h2 className="text-white font-sans text-2xl font-bold mb-1">
                  Step 3 — Face Photo
                </h2>
                <p className="text-blue-200/70 font-sans text-sm">
                  Upload a clear selfie for identity verification.
                </p>
              </div>

              <div
                onClick={() => document.getElementById('face-file').click()}
                className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer bg-white/5 hover:border-green-400/50 transition-colors min-h-[180px] flex items-center justify-center"
              >
                <input type="file" id="face-file" accept="image/*" className="hidden" onChange={handleFaceUpload} />

                {!facePreview ? (
                  <div>
                    <div className="w-[72px] h-[72px] bg-green-500/15 border border-green-400/30 rounded-full flex items-center justify-center mx-auto mb-3.5">
                      <svg width="32" height="32" fill="none" stroke="#6ee7b7" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div className="text-[15px] font-bold text-white mb-1.5">Upload your selfie / face photo</div>
                    <div className="text-[13px] text-blue-200/60">Make sure your face is clearly visible and well-lit</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <img src={facePreview} alt="Face" className="w-[120px] h-[120px] rounded-full object-cover border-4 border-blue-400/30 mx-auto mb-2.5" />
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-300 mb-2">
                      <span>✓</span><span>Face photo uploaded!</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); resetFace() }}
                      className="border border-white/20 rounded-md px-3.5 py-1.5 text-sm text-blue-200/80"
                    >
                      Change Photo
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-between">
                <button type="button" onClick={() => setStep(2)} className="border border-white/20 rounded-lg px-5 py-2.5 text-sm text-blue-200/80">
                  ‹ Back
                </button>
                <button
                  type="button"
                  disabled={!faceFile}
                  onClick={() => setStep(4)}
                  className="bg-blue-500/90 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl px-7 py-2.5 shadow-lg shadow-blue-500/30 border border-blue-400/30"
                >
                  Next — Review Details ›
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="mb-6">
                <h2 className="text-white font-sans text-2xl font-bold mb-1">
                  Step 4 — Your Details
                </h2>
                <p className="text-blue-200/70 font-sans text-sm">
                  Complete your personal information.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">First Name *</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    placeholder="First name"
                  />
                  {step4Errors.firstName && <div className="text-xs text-red-300 mt-1">{step4Errors.firstName}</div>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Last Name *</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    placeholder="Last name"
                  />
                  {step4Errors.lastName && <div className="text-xs text-red-300 mt-1">{step4Errors.lastName}</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Middle Name</label>
                  <input
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    placeholder="Middle name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">
                    Date of Birth * <span className="text-red-300 text-xs">(Must be 18+)</span>
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 [color-scheme:dark]"
                  />
                  {step4Errors.dob && <div className="text-xs text-red-300 mt-1">{step4Errors.dob}</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 [color-scheme:dark]"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Contact Number *</label>
                  <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    maxLength={11}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    placeholder="09XX-XXX-XXXX"
                  />
                  {step4Errors.contact && <div className="text-xs text-red-300 mt-1">{step4Errors.contact}</div>}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Home Address *</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  placeholder="Purok, Street, Barangay New Kababae, Olongapo City"
                />
                {step4Errors.address && <div className="text-xs text-red-300 mt-1">{step4Errors.address}</div>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  placeholder="your@gmail.com"
                />
                <div className="text-xs text-blue-200/50 mt-1">📧 A verification link will be sent to this email after registration.</div>
                {step4Errors.email && <div className="text-xs text-red-300 mt-1">{step4Errors.email}</div>}
              </div>

              <div className="flex justify-between mt-2">
                <button type="button" onClick={() => setStep(3)} className="border border-white/20 rounded-lg px-5 py-2.5 text-sm text-blue-200/80">
                  ‹ Back
                </button>
                <button type="button" onClick={validateStep4} className="bg-blue-500/90 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl px-7 py-2.5 shadow-lg shadow-blue-500/30 border border-blue-400/30">
                  Next — Create Account ›
                </button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="bg-green-500/15 border border-green-400/30 rounded-lg px-3.5 py-3 mb-5 text-sm text-green-200 flex gap-2">
                <span>✅</span>
                <span>Almost done! Set your password to complete your registration.</span>
              </div>

              {submitError && (
                <div className="bg-red-500/15 border border-red-400/30 rounded-lg px-3.5 py-3 mb-4 text-sm text-red-200">
                  {submitError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  minLength={8}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  placeholder="Min 8 characters"
                />
                {password && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full transition-all" style={{ width: strength.pct, background: strength.color }} />
                    </div>
                    <div className="text-xs mt-1 font-medium" style={{ color: strength.color }}>{strength.text}</div>
                  </div>
                )}
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Confirm Password *</label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  placeholder="Re-enter your password"
                />
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(4)} className="border border-white/20 rounded-lg px-5 py-2.5 text-sm text-blue-200/80">
                  ‹ Back
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="bg-blue-500/90 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl px-7 py-2.5 shadow-lg shadow-blue-500/30 border border-blue-400/30"
                >
                  {submitting ? 'Creating your account...' : 'Create Account'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Register