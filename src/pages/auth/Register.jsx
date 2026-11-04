import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  MdArrowBack,
  MdArrowForward,
  MdCheck,
  MdClose,
  MdOutlineMail,
  MdOutlineVisibility,
  MdOutlineVisibilityOff,
} from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../../context/toastContext'
import { passwordProblem } from '../../lib/accounts'
import logo from '../../assets/kp-app-logo.png'
import barangayLogo from '../../assets/barangay-newkababae-logo.jpg'
import AuthBackground from '../../components/AuthBackground'
import TermsStep from './register/TermsStep'
import IdStep from './register/IdStep'
import FaceStep from './register/FaceStep'
import CheckEmailStep from './register/CheckEmailStep'
import { STEP_LABELS, ID_TYPES, latestBirthDate, ageOn } from './register/constants'

const NAME_RE = /^[A-Za-zÀ-ÿÑñ.'\- ]+$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^09\d{9}$/
const inputCls =
  'w-full bg-surface-sunken border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50'

function fieldError(field, value) {
  switch (field) {
    case 'firstName':
    case 'lastName':
      if (!value.trim()) return 'This field is required.'
      if (!NAME_RE.test(value)) return 'Use letters only.'
      return ''
    case 'middleName':
      return value && !NAME_RE.test(value) ? 'Use letters only.' : ''
    case 'dob':
      if (!value) return 'Date of birth is required.'
      if (value < '1900-01-01') return 'Enter a valid date of birth.'
      if (ageOn(value) < 18) return 'You must be at least 18 years old to register.'
      return ''
    case 'sex':
      return value ? '' : 'Please select one.'
    case 'contact':
      if (!value) return 'Contact number is required.'
      return PHONE_RE.test(value) ? '' : 'Enter an 11-digit mobile number starting with 09.'
    case 'address':
      if (!value.trim()) return 'Address is required.'
      return value.trim().length < 10 ? 'Include your purok or street and barangay.' : ''
    case 'email':
      if (!value.trim()) return 'Email is required.'
      return EMAIL_RE.test(value.trim()) ? '' : 'Enter a valid email address.'
    default:
      return ''
  }
}

function Field({ label, error, hint, children, required }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink-soft mb-1.5">
        {label} {required && <span className="text-danger-strong">*</span>}
      </label>
      {children}
      {error ? <div className="text-xs text-danger-strong mt-1">{error}</div> : hint ? <div className="text-xs text-ink-faint mt-1">{hint}</div> : null}
    </div>
  )
}

function PasswordInput({ value, onChange, show, onToggle, placeholder, autoFocus }) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        autoComplete="new-password"
        className={`${inputCls} border-border pr-11`}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft flex items-center"
      >
        {show ? <MdOutlineVisibilityOff className="text-xl" aria-hidden="true" /> : <MdOutlineVisibility className="text-xl" aria-hidden="true" />}
      </button>
    </div>
  )
}

function Rule({ ok, children }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs font-medium ${ok ? 'text-success-strong' : 'text-ink-faint'}`}>
      {ok ? <MdCheck className="text-sm" aria-hidden="true" /> : <MdClose className="text-sm" aria-hidden="true" />}
      {children}
    </li>
  )
}

function Register() {
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState(1)

  const [idType, setIdType] = useState('')
  const [idFront, setIdFront] = useState(null)
  const [idBack, setIdBack] = useState(null)
  const [faceImage, setFaceImage] = useState(null)

  const [form, setForm] = useState({ firstName: '', middleName: '', lastName: '', dob: '', sex: '', contact: '', address: '', email: '' })
  const [errors, setErrors] = useState({})
  const [checkingEmail, setCheckingEmail] = useState(false)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [uploadWarning, setUploadWarning] = useState('')

  const set = (field) => (e) => {
    const value = field === 'contact' ? e.target.value.replace(/\D/g, '').slice(0, 11) : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((x) => ({ ...x, [field]: fieldError(field, value) }))
  }
  const blur = (field) => () => setErrors((x) => ({ ...x, [field]: fieldError(field, form[field]) }))

  function applyScan(details) {
    setForm((f) => ({
      ...f,
      firstName: details.firstName || f.firstName,
      lastName: details.lastName || f.lastName,
      dob: details.dob && /^\d{4}-\d{2}-\d{2}$/.test(details.dob) ? details.dob : f.dob,
      sex: details.sex || f.sex,
      address: details.address || f.address,
    }))
  }

  function go(next) {
    setStep(next)
    window.scrollTo({ top: 0 })
  }

  async function emailTaken(email) {
    const { data, error } = await supabase.rpc('email_registered', { p_email: email.trim() })
    return !error && data === true
  }

  async function checkEmailOnBlur() {
    const msg = fieldError('email', form.email)
    if (msg) return setErrors((x) => ({ ...x, email: msg }))
    setCheckingEmail(true)
    const taken = await emailTaken(form.email)
    setCheckingEmail(false)
    setErrors((x) => ({ ...x, email: taken ? 'taken' : '' }))
  }

  async function submitDetails() {
    const next = {}
    for (const f of Object.keys(form)) next[f] = fieldError(f, form[f])
    if (!next.email) {
      setCheckingEmail(true)
      if (await emailTaken(form.email)) next.email = 'taken'
      setCheckingEmail(false)
    }
    setErrors(next)
    if (Object.values(next).every((m) => !m)) go(5)
  }

  const pwRules = { length: password.length >= 8, mix: /[A-Za-z]/.test(password) && /\d/.test(password) }

  async function handleSubmit() {
    setSubmitError('')
    const problem = passwordProblem(password)
    if (problem) return setSubmitError(problem)
    if (password !== confirm) return setSubmitError('Passwords do not match.')

    setSubmitting(true)
    const email = form.email.trim().toLowerCase()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard?welcome=1`,
        data: {
          full_name: [form.firstName.trim(), form.lastName.trim()].join(' '),
          middle_name: form.middleName.trim() || null,
          date_of_birth: form.dob,
          sex: form.sex,
          contact_number: form.contact,
          address: form.address.trim(),
          id_type: idType,
        },
      },
    })

    if (error || !data.user || data.user.identities?.length === 0) {
      setSubmitting(false)
      if (error && !/already/i.test(error.message)) return setSubmitError(error.message)
      setErrors((x) => ({ ...x, email: 'taken' }))
      return go(4)
    }

    if (data.session) return finish(data.session.user.id)

    const { data: up, error: upError } = await supabase.functions.invoke('register-upload', {
      body: { user_id: data.user.id, email, id_front: idFront, id_back: idBack, face: faceImage },
    })
    setUploadWarning(upError || !up?.ok ? 'Your account was created, but your ID photos could not be saved. Please bring your ID to the Barangay Hall.' : '')
    setSubmitting(false)
    go(6)
  }

  async function uploadPhotos(userId) {
    const put = async (bucket, path, dataUrl) => {
      if (!dataUrl) return true
      const blob = await (await fetch(dataUrl)).blob()
      const { error } = await supabase.storage.from(bucket).upload(`${userId}/${path}`, blob, { contentType: 'image/jpeg', upsert: true })
      return !error
    }
    const results = await Promise.all([put('id-uploads', 'id.jpg', idFront), put('id-uploads', 'id_back.jpg', idBack), put('face-uploads', 'face.jpg', faceImage)])
    return results.every(Boolean)
  }

  async function finish(userId) {
    const ok = await uploadPhotos(userId)
    if (!ok) toast.error('Your account is ready, but your ID photos could not be saved. Please bring your ID to the Barangay Hall.')
    navigate('/dashboard', { replace: true })
  }

  async function confirmByLink() {
    setConfirmError('')
    setVerifying(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email.trim().toLowerCase(), password })
    setVerifying(false)
    if (error || !data.session) {
      return setConfirmError(
        /confirm/i.test(error?.message || '') ? 'Your email is not confirmed yet. Tap the link in the email first, then try again.' : 'We could not log you in. Please try again.'
      )
    }
    toast.success('Email confirmed! Welcome to the KP App.')
    navigate('/dashboard', { replace: true })
  }

  async function resendLink() {
    setConfirmError('')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: form.email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/dashboard?welcome=1` },
    })
    return error ? error.message : ''
  }

  const errBorder = (f) => (errors[f] ? 'border-danger-strong/60' : 'border-border')

  return (
    <div className="min-h-screen relative flex overflow-hidden">
      <AuthBackground />

      <div className="on-dark hidden md:flex w-[400px] flex-col items-center justify-center px-8 py-10 relative z-10 fade-up">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-1 rounded-full bg-surface border border-border shadow-token-sm bounce-1">
            <img src={logo} alt="KP App" className="w-[70px] h-[70px] rounded-full" />
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="p-1 rounded-full bg-surface border border-border shadow-token-sm bounce-2">
            <img src={barangayLogo} alt="Barangay" className="w-[70px] h-[70px] rounded-full bg-white" />
          </div>
        </div>
        <h2 className="text-ink text-xl font-bold mb-1 text-center">Katarungang Pambarangay App</h2>
        <p className="text-ink-soft text-xs mb-8 text-center">Barangay New Kababae, Olongapo City</p>

        <div className="text-left w-full max-w-[260px]">
          {STEP_LABELS.map((s, i) => {
            const num = i + 1
            const isActive = num === step
            const isDone = num < step
            return (
              <div key={num}>
                <div className={`flex items-center gap-3.5 transition-opacity ${isActive ? 'opacity-100' : isDone ? 'opacity-75' : 'opacity-50'}`}>
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${isActive ? 'bg-accent border-accent text-accent-ink ring-4 ring-accent/25' : ''}
                    ${isDone ? 'bg-accent-soft border-accent/40 text-accent' : ''}
                    ${!isActive && !isDone ? 'bg-surface-sunken border-border text-ink-faint' : ''}`}
                  >
                    {isDone ? <MdCheck className="text-base" aria-hidden="true" /> : num}
                  </div>
                  <div>
                    <div className="text-ink text-sm font-semibold">{s.label}</div>
                    <div className="text-ink-faint text-xs">{s.sub}</div>
                  </div>
                </div>
                {num < STEP_LABELS.length && <div className="w-0.5 h-7 bg-border my-1 ml-4" />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 sm:px-6 md:px-12 py-8 md:py-10 overflow-y-auto relative z-10">
        {step < 6 && (
          <div className="on-dark w-full max-w-[580px] mb-3">
            <Link to="/login" className="text-accent hover:text-accent-hover text-sm font-medium inline-flex items-center gap-1">
              <MdArrowBack aria-hidden="true" /> Back to Login
            </Link>
          </div>
        )}
        <div className="on-dark md:hidden w-full max-w-[580px] mb-3">
          <div className="flex gap-1.5 mb-1.5" aria-hidden="true">
            {STEP_LABELS.map((s, i) => (
              <div key={s.label} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-accent' : 'bg-white/25'}`} />
            ))}
          </div>
          <div className="text-ink-soft text-xs font-semibold">
            Step {step} of {STEP_LABELS.length} · {STEP_LABELS[step - 1].label}
          </div>
        </div>

        <div className="w-full max-w-[580px] bg-surface rounded-3xl border border-border shadow-token-lg p-5 sm:p-8 my-auto fade-up delay-2">
          {step === 1 && <TermsStep onNext={() => go(2)} />}

          {step === 2 && <FaceStep preview={faceImage} onCapture={setFaceImage} onRetake={() => setFaceImage(null)} onBack={() => go(1)} onNext={() => go(3)} />}

          {step === 3 && (
            <IdStep
              idType={idType}
              setIdType={setIdType}
              idFront={idFront}
              setIdFront={setIdFront}
              idBack={idBack}
              setIdBack={setIdBack}
              onScanned={applyScan}
              onBack={() => go(2)}
              onNext={() => go(4)}
            />
          )}

          {step === 4 && (
            <>
              <div className="mb-5">
                <h2 className="text-ink text-2xl font-bold mb-1">Your Details</h2>
                <p className="text-ink-soft text-sm">Check the details read from your ID and complete the rest. They must match your ID.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First name" required error={errors.firstName}>
                  <input value={form.firstName} onChange={set('firstName')} onBlur={blur('firstName')} autoComplete="given-name" className={`${inputCls} ${errBorder('firstName')}`} />
                </Field>
                <Field label="Last name" required error={errors.lastName}>
                  <input value={form.lastName} onChange={set('lastName')} onBlur={blur('lastName')} autoComplete="family-name" className={`${inputCls} ${errBorder('lastName')}`} />
                </Field>
                <Field label="Middle name" error={errors.middleName} hint="Leave blank if none">
                  <input value={form.middleName} onChange={set('middleName')} onBlur={blur('middleName')} autoComplete="additional-name" className={`${inputCls} ${errBorder('middleName')}`} />
                </Field>
                <Field label="Date of birth" required error={errors.dob} hint="You must be 18 or older">
                  <input
                    type="date"
                    value={form.dob}
                    onChange={set('dob')}
                    onBlur={blur('dob')}
                    min="1900-01-01"
                    max={latestBirthDate()}
                    autoComplete="bday"
                    className={`${inputCls} ${errBorder('dob')}`}
                  />
                </Field>
                <Field label="Sex" required error={errors.sex}>
                  <select value={form.sex} onChange={set('sex')} onBlur={blur('sex')} className={`${inputCls} ${errBorder('sex')}`}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </Field>
                <Field label="Mobile number" required error={errors.contact}>
                  <input
                    value={form.contact}
                    onChange={set('contact')}
                    onBlur={blur('contact')}
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="09171234567"
                    className={`${inputCls} ${errBorder('contact')}`}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Home address" required error={errors.address}>
                    <input
                      value={form.address}
                      onChange={set('address')}
                      onBlur={blur('address')}
                      autoComplete="street-address"
                      placeholder="Purok, Street, Barangay New Kababae, Olongapo City"
                      className={`${inputCls} ${errBorder('address')}`}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Email address" required error={errors.email && errors.email !== 'taken' ? errors.email : ''}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={set('email')}
                      onBlur={checkEmailOnBlur}
                      autoComplete="email"
                      placeholder="you@gmail.com"
                      className={`${inputCls} ${errBorder('email')}`}
                    />
                  </Field>
                  {errors.email === 'taken' ? (
                    <div role="alert" className="mt-2 bg-danger-soft border border-danger-strong/25 text-danger-strong text-sm rounded-lg px-3.5 py-2.5">
                      This email already has an account. Each person can have only one account.{' '}
                      <Link to="/login" className="font-semibold underline">
                        Log in
                      </Link>{' '}
                      or{' '}
                      <Link to="/forgot-password" className="font-semibold underline">
                        reset your password
                      </Link>
                      .
                    </div>
                  ) : (
                    <div className="text-xs text-ink-faint mt-1 flex items-center gap-1">
                      <MdOutlineMail aria-hidden="true" /> {checkingEmail ? 'Checking email...' : "We'll send a verification email here."}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => go(3)} className="border border-border rounded-lg px-5 py-2.5 text-sm text-ink-soft inline-flex items-center gap-1.5">
                  <MdArrowBack aria-hidden="true" /> Back
                </button>
                <button
                  type="button"
                  onClick={submitDetails}
                  className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-ink font-semibold text-sm rounded-xl px-7 py-2.5 shadow-token-md inline-flex items-center gap-2"
                >
                  Next <MdArrowForward aria-hidden="true" />
                </button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="mb-5">
                <h2 className="text-ink text-2xl font-bold mb-1">Create Account</h2>
                <p className="text-ink-soft text-sm">Set a password for {form.email.trim().toLowerCase()}.</p>
              </div>

              <div className="bg-surface-sunken border border-border rounded-xl p-4 mb-5 text-sm grid grid-cols-[110px_1fr] gap-y-1.5">
                <span className="text-ink-faint">Name</span>
                <span className="text-ink font-medium">{[form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ')}</span>
                <span className="text-ink-faint">ID</span>
                <span className="text-ink font-medium">{ID_TYPES.find((t) => t.value === idType)?.label}</span>
                <span className="text-ink-faint">Mobile</span>
                <span className="text-ink font-medium">{form.contact}</span>
              </div>

              {submitError && (
                <div role="alert" className="bg-danger-soft border border-danger-strong/20 rounded-lg px-3.5 py-3 mb-4 text-sm text-danger-strong">
                  {submitError}
                </div>
              )}

              <div className="flex flex-col gap-4 mb-5">
                <Field label="Password" required>
                  <PasswordInput value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw((v) => !v)} placeholder="Create a password" autoFocus />
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    <Rule ok={pwRules.length}>At least 8 characters</Rule>
                    <Rule ok={pwRules.mix}>Letters and numbers</Rule>
                  </ul>
                </Field>
                <Field label="Confirm password" required error={confirm && confirm !== password ? 'Passwords do not match.' : ''}>
                  <PasswordInput value={confirm} onChange={setConfirm} show={showPw} onToggle={() => setShowPw((v) => !v)} placeholder="Type it again" />
                </Field>
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={() => go(4)} className="border border-border rounded-lg px-5 py-2.5 text-sm text-ink-soft inline-flex items-center gap-1.5">
                  <MdArrowBack aria-hidden="true" /> Back
                </button>
                <button
                  type="button"
                  disabled={submitting || !pwRules.length || !pwRules.mix || password !== confirm}
                  onClick={handleSubmit}
                  className="bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-accent-ink font-semibold text-sm rounded-xl px-7 py-2.5 shadow-token-md inline-flex items-center gap-2"
                >
                  {submitting ? 'Creating your account...' : 'Create account'}
                </button>
              </div>
            </>
          )}

          {step === 6 && (
            <CheckEmailStep
              email={form.email.trim().toLowerCase()}
              busy={verifying}
              error={confirmError}
              uploadWarning={uploadWarning}
              onResend={resendLink}
              onConfirmed={confirmByLink}
              onStartOver={() => go(4)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Register
