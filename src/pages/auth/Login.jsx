import { useRef, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import {
  MdOutlineVisibility,
  MdOutlineVisibilityOff,
  MdOutlineMail,
  MdOutlineLock,
  MdOutlineKeyboardCapslock,
  MdArrowBack,
  MdOutlineNoteAdd,
  MdOutlineManageSearch,
  MdOutlineEvent,
} from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import logo from '../../assets/kp-app-logo.png'
import barangayLogo from '../../assets/barangay-newkababae-logo.jpg'
import AuthBackground from '../../components/AuthBackground'

const POINTS = [
  { icon: MdOutlineNoteAdd, text: 'File complaints online, no waiting in line' },
  { icon: MdOutlineManageSearch, text: 'Track every step of your case' },
  { icon: MdOutlineEvent, text: 'Get your hearing schedule and reminders' },
]

function friendlyError(message) {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Wrong email or password. Please try again.'
  if (m.includes('too many') || m.includes('rate limit')) return 'Too many attempts. Please wait a minute and try again.'
  if (m.includes('fetch') || m.includes('network')) return 'No internet connection. Please check your connection and try again.'
  return message
}

function Logos({ size = 'w-20 h-20' }) {
  return (
    <div className="flex items-center gap-4">
      <div className="p-1 rounded-full bg-surface border border-border bounce-1">
        <img src={logo} alt="KP App logo" className={`${size} rounded-full`} />
      </div>
      <div className="w-px h-14 bg-border" />
      <div className="p-1 rounded-full bg-surface border border-border bounce-2">
        <img src={barangayLogo} alt="Barangay New Kababae logo" className={`${size} rounded-full bg-white`} />
      </div>
    </div>
  )
}

function LoginLoader() {
  return (
    <div className="login-loader" role="status" aria-live="polite">
      <div className="loader-ring">
        <img src={logo} alt="" className="w-[84px] h-[84px] rounded-full" />
      </div>
      <div className="mt-7 text-white text-lg font-semibold">Logging you in</div>
      <div className="loader-dots mt-3" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const cardRef = useRef(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [fieldError, setFieldError] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  const infoMsg = location.state?.message || ''

  function shake() {
    const el = cardRef.current
    if (!el) return
    el.classList.remove('shake')
    void el.offsetWidth
    el.classList.add('shake')
  }

  async function handleLogin(e) {
    e.preventDefault()
    setErrorMsg('')
    setFieldError(false)
    setNeedsConfirmation(false)
    setResendMsg('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

    if (error) {
      setLoading(false)
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setNeedsConfirmation(true)
        setErrorMsg('Please confirm your email address before logging in.')
      } else {
        setFieldError(error.message.toLowerCase().includes('invalid login credentials'))
        setErrorMsg(friendlyError(error.message))
      }
      shake()
      return
    }

    setSuccess(true)
    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    navigate(['admin', 'staff'].includes(profileData?.role) ? '/admin/dashboard' : '/dashboard', { replace: true })
  }

  async function handleResend() {
    setResending(true)
    setResendMsg('')
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() })
    setResending(false)
    setResendMsg(error ? error.message : 'Verification email sent. Please check your inbox.')
  }

  const checkCaps = (e) => setCapsLock(e.getModifierState?.('CapsLock') || false)

  const inputClass = `w-full bg-surface-sunken border text-ink placeholder-ink-faint rounded-xl pl-11 py-3 font-sans text-sm focus:outline-none focus:ring-2 transition-all ${
    fieldError
      ? 'border-danger-strong/60 focus:ring-danger-strong/30'
      : 'border-border focus:ring-accent/50 focus:border-accent/50'
  }`

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 pt-20 pb-10 lg:py-10 overflow-hidden">
      <AuthBackground />
      {success && <LoginLoader />}

      <Link
        to="/"
        className="on-dark absolute top-5 left-5 z-20 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink hover:bg-surface-hover transition-colors"
      >
        <MdArrowBack aria-hidden="true" /> Back to home
      </Link>

      <div className="relative z-10 w-full max-w-5xl grid items-center gap-12 lg:grid-cols-[1fr_440px]">
        <div className="on-dark hidden lg:block fade-up">
          <Logos />
          <h1 className="mt-8 text-5xl font-bold leading-[1.1] tracking-tight text-ink">
            Welcome back to
            <br />
            KP App
          </h1>
          <p className="mt-4 max-w-md text-lg text-ink-soft">
            The Katarungang Pambarangay portal of Barangay New Kababae.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => {
              const Icon = p.icon
              return (
                <li key={p.text} className="flex items-center gap-3 text-ink">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface">
                    <Icon className="text-xl" aria-hidden="true" />
                  </span>
                  {p.text}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="on-dark flex flex-col items-center mb-7 lg:hidden fade-up">
            <Logos size="w-16 h-16" />
            <h1 className="mt-4 text-ink text-2xl font-semibold">KP App</h1>
            <p className="text-ink-soft text-sm mt-1">Katarungang Pambarangay Portal</p>
          </div>

          <div className="fade-up delay-2">
            <div ref={cardRef} className="bg-surface rounded-3xl shadow-token-lg p-7 sm:p-8 border border-border">
              <h2 className="text-ink text-2xl font-bold">Log in</h2>
              <p className="text-ink-soft text-sm mt-1 mb-6">Use the email and password you registered with.</p>

              {infoMsg && (
                <div className="bg-success-soft border border-success-strong/20 text-success-strong text-sm rounded-xl px-4 py-3 mb-4">
                  {infoMsg}
                </div>
              )}

              {errorMsg && (
                <div role="alert" className="bg-danger-soft border border-danger-strong/20 text-danger-strong text-sm rounded-xl px-4 py-3 mb-4">
                  {errorMsg}
                  {needsConfirmation && (
                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending || !email}
                        className="text-danger-strong font-semibold underline disabled:opacity-50"
                      >
                        {resending ? 'Sending...' : 'Resend verification email'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {resendMsg && (
                <div className="bg-info-soft border border-info-strong/20 text-info-strong text-sm rounded-xl px-4 py-3 mb-4">{resendMsg}</div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-ink-soft font-sans text-sm font-medium mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <MdOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-ink-faint pointer-events-none" aria-hidden="true" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setFieldError(false)
                      }}
                      required
                      autoFocus
                      autoComplete="email"
                      aria-invalid={fieldError}
                      className={`${inputClass} pr-4`}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-ink-soft font-sans text-sm font-medium">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-accent hover:text-accent-hover font-sans text-sm font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <MdOutlineLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-ink-faint pointer-events-none" aria-hidden="true" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setFieldError(false)
                      }}
                      onKeyDown={checkCaps}
                      onKeyUp={checkCaps}
                      onBlur={() => setCapsLock(false)}
                      required
                      autoComplete="current-password"
                      aria-invalid={fieldError}
                      className={`${inputClass} pr-11`}
                      placeholder="••••••••"
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
                  {capsLock && (
                    <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-warning-strong" role="status">
                      <MdOutlineKeyboardCapslock className="text-base" aria-hidden="true" /> Caps Lock is on
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || success}
                  className="w-full h-12 inline-flex items-center justify-center gap-2.5 bg-accent hover:bg-accent-hover active:scale-[0.98] transition-[background-color,transform] text-accent-ink font-sans font-semibold text-sm rounded-xl mt-2 disabled:opacity-70 disabled:active:scale-100"
                >
                  {loading ? (
                    <>
                      <span className="spinner" aria-hidden="true" /> Logging in...
                    </>
                  ) : (
                    'Log in'
                  )}
                </button>
              </form>

              <p className="text-ink-soft font-sans text-sm text-center mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-accent hover:text-accent-hover font-semibold">
                  Register here
                </Link>
              </p>
            </div>
          </div>

          <p className="on-dark text-center text-xs text-ink-faint mt-6 fade-up delay-3">
            © {new Date().getFullYear()} KP App · Barangay New Kababae
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
