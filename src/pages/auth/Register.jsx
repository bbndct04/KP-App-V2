import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MdArrowBack, MdArrowForward, MdArrowDownward, MdCheck, MdOutlineLock, MdOutlineCheckCircle, MdOutlineWarningAmber, MdOutlineNoPhotography, MdOutlinePhotoCamera, MdOutlineMail, MdOutlineMarkEmailUnread, MdOutlineVisibility, MdOutlineVisibilityOff } from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import logo from '../../assets/kp-app-logo.png'
import barangayLogo from '../../assets/barangay-newkababae-logo.jpg'

const STEP_LABELS = [
  { label: 'Terms & Privacy', sub: 'Read and agree to terms' },
  { label: 'ID Verification', sub: 'Upload your valid ID' },
  { label: 'Face Photo', sub: 'Take a live photo' },
  { label: 'Your Details', sub: 'Complete your information' },
  { label: 'Create Account', sub: 'Set your password' },
]

const ID_TYPES = [
  { value: 'national', label: 'National ID (PhilSys)' },
  { value: 'passport', label: 'Philippine Passport' },
  { value: 'drivers_license', label: "Driver's License (LTO)" },
  { value: 'sss', label: 'SSS ID / UMID' },
  { value: 'gsis', label: 'GSIS eCard' },
  { value: 'prc', label: 'PRC ID' },
  { value: 'voters', label: "Voter's ID / COMELEC Certification" },
  { value: 'postal', label: 'Postal ID' },
  { value: 'tin', label: 'TIN ID (BIR)' },
  { value: 'philhealth', label: 'PhilHealth ID' },
  { value: 'pagibig', label: 'Pag-IBIG (HDMF) ID' },
  { value: 'owwa', label: 'OWWA / OFW ID' },
  { value: 'seaman', label: "Seaman's Book" },
  { value: 'senior_citizen', label: 'Senior Citizen ID' },
  { value: 'pwd', label: 'PWD ID' },
  { value: 'nbi', label: 'NBI Clearance' },
  { value: 'barangay', label: 'Barangay ID / Certification' },
]

const ID_TYPE_KEYWORDS = {
  national: ['philippine identification', 'philsys', 'psn', 'republika ng pilipinas', 'pambansang paulahan'],
  passport: ['passport', 'department of foreign affairs', 'dfa', 'republic of the philippines passport'],
  drivers_license: ["driver's license", 'drivers license', 'land transportation office', 'lto', 'non-professional', 'professional license'],
  sss: ['social security system', 'sss', 'ss number', 'ss no', 'unified multi-purpose id', 'umid'],
  gsis: ['government service insurance system', 'gsis', 'ecard'],
  prc: ['professional regulation commission', 'prc'],
  voters: ['commission on elections', 'comelec', "voter's id", 'voter certification'],
  postal: ['philippine postal corporation', 'phlpost', 'postal id'],
  tin: ['bureau of internal revenue', 'bir', 'tin id', 'taxpayer identification'],
  philhealth: ['philippine health insurance corporation', 'philhealth'],
  pagibig: ['pag-ibig', 'pagibig', 'home development mutual fund', 'hdmf'],
  owwa: ['overseas workers welfare administration', 'owwa'],
  seaman: ["seaman's book", 'seafarer', 'maritime industry authority', 'marina'],
  senior_citizen: ['senior citizen', 'office for senior citizens affairs', 'osca'],
  pwd: ['person with disability', 'pwd id'],
  nbi: ['national bureau of investigation', 'nbi clearance'],
  barangay: ['barangay id', 'barangay certification', 'punong barangay'],
}

function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [agreed, setAgreed] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const termsRef = useRef(null)

  const [idType, setIdType] = useState('')
  const [idFile, setIdFile] = useState(null)
  const [idPreview, setIdPreview] = useState(null)
  const [idScanStatus, setIdScanStatus] = useState('idle')
  const [ocrDebugText, setOcrDebugText] = useState('')
  const [idTypeMismatch, setIdTypeMismatch] = useState(false)
  const [mismatchOverride, setMismatchOverride] = useState(false)

  const [faceFile, setFaceFile] = useState(null)
  const [facePreview, setFacePreview] = useState(null)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

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
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [strength, setStrength] = useState({ pct: '0%', color: '#f87171', text: '' })

  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  function handleTermsScroll() {
    const el = termsRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10
    if (atBottom) setScrolledToBottom(true)
  }

  function runIdTypeCheck(text, type) {
    const keywords = ID_TYPE_KEYWORDS[type] || []
    const lower = (text || '').toLowerCase()
    const matched = keywords.some((k) => lower.includes(k))
    setIdTypeMismatch(!matched)
    setMismatchOverride(false)
  }

  function handleIDUpload(e) {
    const file = e.target.files[0]
    if (!file || !idType) return
    setIdFile(file)
    setIdPreview(URL.createObjectURL(file))
    setIdScanStatus('scanning')
    setIdTypeMismatch(false)
    setMismatchOverride(false)

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1]

      try {
        const { data, error } = await supabase.functions.invoke('verify-id', {
          body: { imageBase64: base64 },
        })

        if (error || !data?.text) {
          setIdScanStatus('success')
          setIdTypeMismatch(true) // no text read at all — can't confirm the ID type, so flag it
          return
        }

        const text = data.text
        setOcrDebugText(text || '(empty — OCR found no text)')
        runIdTypeCheck(text, idType)

        const nameMatch = text.match(/(?:Name|Pangalan)[:\s]+([A-Za-z ,.'-]+)/i)
        if (nameMatch && nameMatch[1]) {
          const parts = nameMatch[1].trim().split(' ')
          if (parts.length >= 2) {
            setFirstName(parts[0])
            setLastName(parts[parts.length - 1])
          }
        }

        const dobMatch = text.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/)
        if (dobMatch) {
          const [d, m, y] = dobMatch[1].split(/[\/\-]/)
          if (y && m && d) setDob(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
        }

        const sexMatch = text.match(/\b(MALE|FEMALE)\b/i)
        if (sexMatch) {
          const val = sexMatch[1].toUpperCase()
          setSex(val === 'MALE' ? 'Male' : 'Female')
        }

        const addressMatch = text.match(/(?:Address)[:\s]+([^\n]{5,80})/i)
        if (addressMatch && addressMatch[1]) {
          setAddress(addressMatch[1].trim())
        }

        setIdScanStatus('success')
      } catch (err) {
        setOcrDebugText('ERROR: ' + err.message)
        setIdScanStatus('success')
        setIdTypeMismatch(true)
      }
    }
    reader.readAsDataURL(file)
  }

  function resetID() {
    setIdFile(null)
    setIdPreview(null)
    setIdScanStatus('idle')
    setIdTypeMismatch(false)
    setMismatchOverride(false)
    setOcrDebugText('')
  }

  function handleIdTypeChange(newType) {
    setIdType(newType)
    if (ocrDebugText) runIdTypeCheck(ocrDebugText, newType)
  }

  // Live camera for the face photo — starts when step 3 is active and no photo has been captured yet
  useEffect(() => {
    if (step !== 3 || facePreview) return
    let cancelled = false

    async function startCamera() {
      setCameraError('')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (err) {
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera access was denied. Please allow camera access in your browser settings, then reload this page.'
            : 'Could not access a camera. Make sure your device has one and that no other app is using it.'
        )
      }
    }
    startCamera()

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [step, facePreview])

  function captureFace() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth) return

    const size = Math.min(video.videoWidth, video.videoHeight)
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const sx = (video.videoWidth - size) / 2
    const sy = (video.videoHeight - size) / 2
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size)

    canvas.toBlob((blob) => {
      setFaceFile(new File([blob], 'face-capture.jpg', { type: 'image/jpeg' }))
      setFacePreview(canvas.toDataURL('image/jpeg'))
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }, 'image/jpeg', 0.92)
  }

  function retakeFace() {
    setFaceFile(null)
    setFacePreview(null)
  }

  function validateField(field, value) {
    let msg = ''
    if (field === 'firstName' || field === 'lastName') {
      if (!value.trim()) msg = 'This field is required.'
      else if (!/^[A-Za-zÀ-ÿ.'\- ]+$/.test(value)) msg = 'Only letters are allowed.'
    }
    if (field === 'contact' && value) {
      if (!/^09[0-9]{9}$/.test(value)) msg = 'Enter a valid 11-digit number starting with 09.'
    }
    if (field === 'email') {
      if (!value.trim()) msg = 'Email is required.'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = 'Enter a valid email address.'
    }
    if (field === 'address' && !value.trim()) msg = 'Address is required.'
    setStep4Errors((prev) => ({ ...prev, [field]: msg }))
  }

  function validateStep4() {
    const errors = {}
    if (!firstName.trim()) errors.firstName = 'This field is required.'
    else if (!/^[A-Za-zÀ-ÿ.'\- ]+$/.test(firstName)) errors.firstName = 'Only letters are allowed.'

    if (!lastName.trim()) errors.lastName = 'This field is required.'
    else if (!/^[A-Za-zÀ-ÿ.'\- ]+$/.test(lastName)) errors.lastName = 'Only letters are allowed.'

    if (!dob) {
      errors.dob = 'Date of birth is required.'
    } else {
      const today = new Date()
      const birth = new Date(dob)
      let age = today.getFullYear() - birth.getFullYear()
      const mDiff = today.getMonth() - birth.getMonth()
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--
      if (age < 18) errors.dob = 'You must be at least 18 years old to register.'
    }

    if (contact && !/^09[0-9]{9}$/.test(contact)) {
      errors.contact = 'Enter a valid 11-digit number starting with 09.'
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
      { pct: '100%', color: '#34d399', text: 'Strong' },
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
          id_type: idType || null,
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

    if (data.session) {
      navigate('/dashboard')
    } else {
      setStep(6)
    }
  }

  async function handleResend() {
    setResending(true)
    setResendMsg('')
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    setResendMsg(error ? error.message : 'Verification email re-sent. Please check your inbox.')
  }

  return (
    <div className="min-h-screen relative flex bg-bg overflow-hidden">
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />

      {/* LEFT PANEL */}
      <div className="hidden md:flex w-[400px] flex-col items-center justify-center px-8 py-10 relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-1 rounded-full bg-surface border border-border shadow-token-sm bounce-1">
            <img src={logo} alt="KP App" className="w-[70px] h-[70px] rounded-full" />
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="p-1 rounded-full bg-surface border border-border shadow-token-sm bounce-2">
            <img src={barangayLogo} alt="Barangay" className="w-[70px] h-[70px] rounded-full bg-white" />
          </div>
        </div>
        <h2 className="text-ink font-sans text-xl font-bold mb-1 text-center">
          Katarungang Pambarangay App
        </h2>
        <p className="text-ink-soft font-sans text-xs mb-8 text-center">
          Barangay New Kababae, Olongapo City
        </p>

        <div className="text-left w-full max-w-[260px]">
          {STEP_LABELS.map((s, i) => {
            const num = i + 1
            const isActive = num === step
            const isDone = num < step || step === 6
            return (
              <div key={num}>
                <div className={`flex items-center gap-3.5 transition-opacity ${isActive ? 'opacity-100' : isDone ? 'opacity-75' : 'opacity-50'}`}>
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${isActive ? 'bg-accent border-accent text-accent-ink ring-4 ring-accent/25' : ''}
                    ${isDone ? 'bg-accent-soft border-accent/40 text-accent' : ''}
                    ${!isActive && !isDone ? 'bg-surface-sunken border-border text-ink-faint' : ''}`}>
                    {isDone ? <MdCheck className="text-base" aria-hidden="true" /> : num}
                  </div>
                  <div>
                    <div className="text-ink font-sans text-sm font-semibold">{s.label}</div>
                    <div className="text-ink-faint font-sans text-xs">{s.sub}</div>
                  </div>
                </div>
                {num < 5 && <div className="w-0.5 h-7 bg-border my-1 ml-4" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT FORM SIDE */}
      <div className="flex-1 flex flex-col items-center px-6 md:px-12 py-10 overflow-y-auto relative z-10">
        {step !== 6 && (
          <div className="w-full max-w-[580px] mb-3">
            <Link to="/login" className="text-accent hover:text-accent-hover text-sm font-medium inline-flex items-center gap-1">
              <MdArrowBack aria-hidden="true" /> Back to Login
            </Link>
          </div>
        )}
        <div className="w-full max-w-[580px] bg-surface rounded-3xl border border-border shadow-token-lg p-8 my-auto">

          {step === 1 && (
            <>
              <div className="mb-6">
                <h2 className="text-ink font-sans text-2xl font-bold mb-1">
                  Step 1 — Terms & Privacy Policy
                </h2>
                <p className="text-ink-soft font-sans text-sm">
                  Please read and agree to our Terms of Service and Data Privacy Act before proceeding.
                </p>
              </div>

              <div className="border border-border rounded-xl overflow-hidden mb-5 bg-surface-sunken">
                <div className="bg-surface-hover px-3.5 py-2.5 text-sm font-bold text-ink border-b border-border">
                  Terms of Service, Data Privacy Act & Age Requirement
                </div>
                <div
                  ref={termsRef}
                  onScroll={handleTermsScroll}
                  className="p-3.5 max-h-[200px] overflow-y-auto text-sm text-ink-soft leading-relaxed space-y-2.5"
                >
                  <p><strong className="text-ink">Age Requirement</strong><br />
                  This system is exclusively for individuals who are <strong className="text-ink">18 years old and above</strong>. By registering, you confirm that you are at least 18 years of age. Minors are strictly prohibited from using this system in compliance with Philippine law and the Data Privacy Act of 2012.</p>

                  <p><strong className="text-ink">1. Acceptance of Terms</strong><br />
                  By registering for a Katarungang Pambarangay App (KP App) account, you agree to be bound by these Terms of Service and the Data Privacy Act of 2012 (Republic Act No. 10173). If you do not agree, please do not use this system.</p>

                  <p><strong className="text-ink">2. Purpose of the System</strong><br />
                  The KP App is an official digital platform of Barangay New Kababae, Olongapo City, Zambales. It is designed to facilitate the filing, processing, and resolution of complaints following the Katarungang Pambarangay Law (RA 7160, Sections 399-422). The system is exclusively for residents of Barangay New Kababae who are 18 years old and above.</p>

                  <p><strong className="text-ink">3. Data Privacy Act of 2012 (RA 10173)</strong><br />
                  In compliance with the Data Privacy Act of 2012, Barangay New Kababae, as the Personal Information Controller, hereby informs you that:<br /><br />
                  a) <strong className="text-ink">Collection:</strong> We collect your personal information including your name, address, contact number, date of birth, and government-issued ID for the purpose of identity verification and account creation.<br /><br />
                  b) <strong className="text-ink">Purpose:</strong> Your personal data will be used solely for processing your complaints and facilitating the Katarungang Pambarangay process.<br /><br />
                  c) <strong className="text-ink">Sharing:</strong> Your data will only be shared with authorized barangay officials involved in the complaint resolution process. We will not share your data with third parties without your consent.<br /><br />
                  d) <strong className="text-ink">Retention:</strong> Your personal data will be retained for the period necessary to fulfill the purposes for which it was collected, in accordance with applicable laws.<br /><br />
                  e) <strong className="text-ink">Rights:</strong> You have the right to access, correct, and request deletion of your personal data. Contact the Barangay Secretary for data privacy concerns.<br /><br />
                  f) <strong className="text-ink">Security:</strong> We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, disclosure, alteration, or destruction.</p>

                  <p><strong className="text-ink">4. User Responsibilities</strong><br />
                  You agree to provide accurate, truthful, and complete information. Filing false, misleading, or malicious complaints is strictly prohibited and may result in account suspension and legal action under the Revised Penal Code of the Philippines.</p>

                  <p><strong className="text-ink">5. ID Verification</strong><br />
                  Your government-issued ID is scanned using OCR technology only to pre-fill your registration form. The image is processed temporarily and is not permanently stored. Any valid Philippine government-issued ID is accepted (see the list on the ID upload step).</p>

                  <p><strong className="text-ink">6. Age Verification</strong><br />
                  By proceeding with registration, you declare under oath that you are 18 years of age or older. Providing false information about your age is a violation of these terms and may result in legal consequences.</p>

                  <p><strong className="text-ink">7. Prohibited Conduct</strong><br />
                  You must not: submit false complaints, impersonate another person, use the system for unlawful purposes, or allow minors to use your account.</p>

                  <p><strong className="text-ink">8. Account Suspension</strong><br />
                  The Barangay Administrator reserves the right to suspend or terminate accounts found in violation of these terms without prior notice.</p>

                  <p><strong className="text-ink">9. Consent</strong><br />
                  By checking the box below, you freely give your consent to the collection and processing of your personal data as described above, in accordance with the Data Privacy Act of 2012. You also confirm that you are 18 years of age or older.</p>
                </div>
                <div className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 ${scrolledToBottom ? 'bg-success-soft text-success-strong' : 'bg-warning-soft text-warning-strong'}`}>
                  {scrolledToBottom ? <><MdCheck className="text-base" aria-hidden="true" /> You can now agree to the terms</> : <><MdArrowDownward className="text-base" aria-hidden="true" /> Scroll down to read all terms before agreeing</>}
                </div>
              </div>

              <div className="mb-5">
                <label className={`flex items-start gap-2.5 ${scrolledToBottom ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    disabled={!scrolledToBottom}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-[var(--accent)] disabled:opacity-40"
                  />
                  <span className="text-sm text-ink-soft leading-relaxed">
                    I have read and agree to the <strong className="text-accent">Terms of Service</strong>, <strong className="text-accent">Data Privacy Act of 2012</strong>, and confirm that I am <strong className="text-accent">18 years old or above</strong>.
                  </span>
                </label>
                {!scrolledToBottom && (
                  <div className="text-xs text-ink-faint mt-1 ml-7 flex items-center gap-1"><MdOutlineLock aria-hidden="true" /> Scroll and read all terms above to unlock</div>
                )}
              </div>

              <button
                type="button"
                disabled={!agreed}
                onClick={() => setStep(2)}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-accent-ink font-sans font-semibold text-sm rounded-xl py-3 transition-all shadow-token-md inline-flex items-center justify-center gap-2"
              >
                I Agree — Proceed to ID Verification <MdArrowForward aria-hidden="true" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-6">
                <h2 className="text-ink font-sans text-2xl font-bold mb-1">
                  Step 2 — ID Verification
                </h2>
                <p className="text-ink-soft font-sans text-sm">
                  Select your ID type, then upload a clear photo of it.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">ID Type *</label>
                <select
                  value={idType}
                  onChange={(e) => handleIdTypeChange(e.target.value)}
                  className="w-full bg-surface-sunken border border-border text-ink rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="">Select the ID you'll upload</option>
                  {ID_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <div className="text-xs text-ink-faint mt-1">Any valid Philippine government-issued ID is accepted.</div>
              </div>

              <div
                onClick={() => idType && document.getElementById('id-file').click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center min-h-[180px] flex items-center justify-center transition-colors ${
                  idType
                    ? 'border-border bg-surface-sunken hover:border-accent/50 hover:bg-surface-hover cursor-pointer'
                    : 'border-border bg-surface-sunken opacity-50 cursor-not-allowed'
                }`}
              >
                <input type="file" id="id-file" accept="image/*" className="hidden" onChange={handleIDUpload} disabled={!idType} />

                {!idPreview ? (
                  <div>
                    <div className="w-[72px] h-[72px] bg-accent-soft border border-accent/30 rounded-full flex items-center justify-center mx-auto mb-3.5 text-accent">
                      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="10" r="1.5"/><path d="m2 15 5-5 4 4 3-3 5 5"/></svg>
                    </div>
                    <div className="text-[15px] font-bold text-ink mb-1.5">
                      {idType ? 'Click to upload your ID' : 'Select an ID type above first'}
                    </div>
                    <div className="text-sm text-ink-soft mb-1">Any valid Philippine government ID</div>
                    <div className="text-xs text-ink-faint">JPG, PNG — Max 10MB</div>
                  </div>
                ) : (
                  <div className="w-full">
                    <img src={idPreview} alt="ID" className="max-w-full max-h-[200px] rounded-xl object-contain mx-auto" />
                    {idScanStatus === 'scanning' && (
                      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium mt-2.5 bg-info-soft text-info-strong">
                        <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                        <span>Reading your ID — please wait...</span>
                      </div>
                    )}
                    {idScanStatus === 'success' && !idTypeMismatch && (
                      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium mt-2.5 bg-success-soft text-success-strong">
                        <MdOutlineCheckCircle className="text-lg flex-shrink-0" aria-hidden="true" /><span>ID verified and uploaded successfully.</span>
                      </div>
                    )}
                    {idScanStatus === 'success' && idTypeMismatch && (
                      <div
                        className="rounded-lg p-3.5 mt-2.5 text-left bg-warning-soft border border-warning-strong/30 text-warning-strong"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="font-semibold text-sm mb-1 flex items-center gap-1.5"><MdOutlineWarningAmber className="text-lg flex-shrink-0" aria-hidden="true" /> This doesn't look like a {ID_TYPES.find((t) => t.value === idType)?.label}</div>
                        <div className="text-xs mb-2.5 leading-relaxed">
                          We couldn't confirm this ID type from the photo. It may be a different ID, or the photo may be unclear — try a sharper photo, or continue if you're sure this is correct.
                        </div>
                        {!mismatchOverride ? (
                          <button type="button" onClick={() => setMismatchOverride(true)} className="text-xs font-bold underline">
                            Yes, this is correct — Continue anyway
                          </button>
                        ) : (
                          <div className="text-xs text-success-strong font-semibold flex items-center gap-1"><MdCheck aria-hidden="true" /> Confirmed — you may proceed</div>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); resetID() }}
                      className="mt-2.5 border border-border rounded-md px-3.5 py-1.5 text-sm text-ink-soft"
                    >
                      Change ID
                    </button>
                     {ocrDebugText && (
                      <div className="mt-3 text-left bg-surface-sunken border border-border rounded-lg p-3 text-xs text-ink-soft max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                        <strong className="text-ink">OCR Debug Output:</strong><br />
                        {ocrDebugText}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <button type="button" onClick={() => setStep(1)} className="border border-border rounded-lg px-5 py-2.5 text-sm text-ink-soft inline-flex items-center gap-1.5">
                  <MdArrowBack aria-hidden="true" /> Back
                </button>
                <button
                  type="button"
                  disabled={!idFile || idScanStatus === 'scanning' || (idTypeMismatch && !mismatchOverride)}
                  onClick={() => setStep(3)}
                  className="bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-accent-ink font-semibold text-sm rounded-xl px-7 py-2.5 shadow-token-md inline-flex items-center gap-2"
                >
                  Next — Take Selfie <MdArrowForward aria-hidden="true" />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="mb-6">
                <h2 className="text-ink font-sans text-2xl font-bold mb-1">
                  Step 3 — Face Photo
                </h2>
                <p className="text-ink-soft font-sans text-sm">
                  Take a live photo for identity verification.
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden bg-surface-sunken border border-border min-h-[280px] flex items-center justify-center relative">
                {cameraError ? (
                  <div className="p-8 text-center">
                    <MdOutlineNoPhotography className="text-5xl text-ink-faint mx-auto mb-3" aria-hidden="true" />
                    <div className="text-[15px] font-bold text-ink mb-1.5">Camera unavailable</div>
                    <div className="text-sm text-ink-soft max-w-[320px] mx-auto">{cameraError}</div>
                  </div>
                ) : !facePreview ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-[280px] h-[280px] object-cover rounded-2xl scale-x-[-1]"
                    />
                    <div className="absolute inset-0 pointer-events-none border-4 border-accent/30 rounded-2xl m-4" />
                  </>
                ) : (
                  <img src={facePreview} alt="Captured face" className="w-[280px] h-[280px] object-cover rounded-2xl scale-x-[-1]" />
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="mt-4 flex justify-center">
                {!facePreview && !cameraError && (
                  <button
                    type="button"
                    onClick={captureFace}
                    className="bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-sm rounded-xl px-8 py-3 shadow-token-md inline-flex items-center gap-2"
                  >
                    <MdOutlinePhotoCamera className="text-xl" aria-hidden="true" /> Capture Photo
                  </button>
                )}
                {facePreview && (
                  <div className="flex items-center gap-3">
                    <span className="text-success-strong text-sm font-medium flex items-center gap-1.5"><MdOutlineCheckCircle className="text-lg" aria-hidden="true" /> Photo captured</span>
                    <button type="button" onClick={retakeFace} className="border border-border rounded-lg px-4 py-2 text-sm text-ink-soft">
                      Retake
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-between">
                <button type="button" onClick={() => setStep(2)} className="border border-border rounded-lg px-5 py-2.5 text-sm text-ink-soft inline-flex items-center gap-1.5">
                  <MdArrowBack aria-hidden="true" /> Back
                </button>
                <button
                  type="button"
                  disabled={!faceFile}
                  onClick={() => setStep(4)}
                  className="bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-accent-ink font-semibold text-sm rounded-xl px-7 py-2.5 shadow-token-md inline-flex items-center gap-2"
                >
                  Next — Review Details <MdArrowForward aria-hidden="true" />
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="mb-6">
                <h2 className="text-ink font-sans text-2xl font-bold mb-1">
                  Step 4 — Your Details
                </h2>
                <p className="text-ink-soft font-sans text-sm">
                  Complete your personal information.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1.5">First Name *</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => validateField('firstName', firstName)}
                    autoFocus
                    autoComplete="given-name"
                    className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="First name"
                  />
                  {step4Errors.firstName && <div className="text-xs text-danger-strong mt-1">{step4Errors.firstName}</div>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1.5">Last Name *</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => validateField('lastName', lastName)}
                    autoComplete="family-name"
                    className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="Last name"
                  />
                  {step4Errors.lastName && <div className="text-xs text-danger-strong mt-1">{step4Errors.lastName}</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1.5">Middle Name</label>
                  <input
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    autoComplete="additional-name"
                    className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="Middle name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1.5">
                    Date of Birth * <span className="text-danger-strong text-xs">(Must be 18+)</span>
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    autoComplete="bday"
                    className="w-full bg-surface-sunken border border-border text-ink rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  {step4Errors.dob && <div className="text-xs text-danger-strong mt-1">{step4Errors.dob}</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1.5">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="w-full bg-surface-sunken border border-border text-ink rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1.5">Contact Number *</label>
                  <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    onBlur={() => validateField('contact', contact)}
                    maxLength={11}
                    autoComplete="tel"
                    className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="09XX-XXX-XXXX"
                  />
                  {step4Errors.contact && <div className="text-xs text-danger-strong mt-1">{step4Errors.contact}</div>}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">Home Address *</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={() => validateField('address', address)}
                  autoComplete="street-address"
                  className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="Purok, Street, Barangay New Kababae, Olongapo City"
                />
                {step4Errors.address && <div className="text-xs text-danger-strong mt-1">{step4Errors.address}</div>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => validateField('email', email)}
                  autoComplete="email"
                  className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="your@gmail.com"
                />
                <div className="text-xs text-ink-faint mt-1 flex items-center gap-1"><MdOutlineMail aria-hidden="true" /> A verification link will be sent to this email after registration.</div>
                {step4Errors.email && <div className="text-xs text-danger-strong mt-1">{step4Errors.email}</div>}
              </div>

              <div className="flex justify-between mt-2">
                <button type="button" onClick={() => setStep(3)} className="border border-border rounded-lg px-5 py-2.5 text-sm text-ink-soft inline-flex items-center gap-1.5">
                  <MdArrowBack aria-hidden="true" /> Back
                </button>
                <button type="button" onClick={validateStep4} className="bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-sm rounded-xl px-7 py-2.5 shadow-token-md inline-flex items-center gap-2">
                  Next — Create Account <MdArrowForward aria-hidden="true" />
                </button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="bg-success-soft border border-success-strong/20 rounded-lg px-3.5 py-3 mb-5 text-sm text-success-strong flex gap-2">
                <MdOutlineCheckCircle className="text-xl flex-shrink-0" aria-hidden="true" />
                <span>Almost done! Set your password to complete your registration.</span>
              </div>

              {submitError && (
                <div className="bg-danger-soft border border-danger-strong/20 rounded-lg px-3.5 py-3 mb-4 text-sm text-danger-strong">
                  {submitError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    minLength={8}
                    autoFocus
                    autoComplete="new-password"
                    className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="Min 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft flex items-center"
                  >
                    {showPassword ? <MdOutlineVisibilityOff className="text-xl" aria-hidden="true" /> : <MdOutlineVisibility className="text-xl" aria-hidden="true" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                      <div className="h-full transition-all" style={{ width: strength.pct, background: strength.color }} />
                    </div>
                    <div className="text-xs mt-1 font-medium" style={{ color: strength.color }}>{strength.text}</div>
                  </div>
                )}
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    autoComplete="new-password"
                    className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm((v) => !v)}
                    aria-label={showPasswordConfirm ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft flex items-center"
                  >
                    {showPasswordConfirm ? <MdOutlineVisibilityOff className="text-xl" aria-hidden="true" /> : <MdOutlineVisibility className="text-xl" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(4)} className="border border-border rounded-lg px-5 py-2.5 text-sm text-ink-soft inline-flex items-center gap-1.5">
                  <MdArrowBack aria-hidden="true" /> Back
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-ink font-semibold text-sm rounded-xl px-7 py-2.5 shadow-token-md inline-flex items-center gap-2"
                >
                  {submitting ? 'Creating your account...' : 'Create Account'}
                </button>
              </div>
            </>
          )}

          {step === 6 && (
            <div className="text-center py-4">
              <div className="w-[72px] h-[72px] bg-success-soft border border-success-strong/30 rounded-full flex items-center justify-center mx-auto mb-4.5 text-3xl">
                <MdOutlineMarkEmailUnread className="text-4xl text-success-strong" aria-hidden="true" />
              </div>
              <h2 className="text-ink font-sans text-2xl font-bold mb-2">Check your email</h2>
              <p className="text-ink-soft text-sm leading-relaxed mb-1 max-w-[380px] mx-auto">
                We sent a verification link to
              </p>
              <p className="text-ink font-semibold text-sm mb-5">{email}</p>
              <p className="text-ink-faint text-sm leading-relaxed mb-6 max-w-[380px] mx-auto">
                Click the link in that email to activate your account, then come back here to sign in.
              </p>

              {resendMsg && (
                <div className="bg-info-soft border border-info-strong/20 text-info-strong text-sm rounded-lg px-4 py-2.5 mb-4 max-w-[380px] mx-auto">
                  {resendMsg}
                </div>
              )}

              <div className="flex flex-col gap-2.5 max-w-[280px] mx-auto">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-sm rounded-xl py-3 shadow-token-md"
                >
                  Go to Login
                </button>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="border border-border text-ink-soft rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
                >
                  {resending ? 'Sending...' : "Didn't get it? Resend email"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Register