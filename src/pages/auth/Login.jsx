import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { MdOutlineVisibility, MdOutlineVisibilityOff } from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import logo from '../../assets/kp-app-logo.png'
import barangayLogo from '../../assets/barangay-newkababae-logo.jpg'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  const infoMsg = location.state?.message || ''

  async function handleLogin(e) {
    e.preventDefault()
    setErrorMsg('')
    setNeedsConfirmation(false)
    setResendMsg('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setLoading(false)
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setNeedsConfirmation(true)
        setErrorMsg('Please confirm your email address before signing in.')
      } else {
        setErrorMsg(error.message)
      }
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    setLoading(false)

    if (profileData?.role === 'admin' || profileData?.role === 'staff') {
      navigate('/admin/dashboard')
    } else {
      navigate('/dashboard')
    }
  }

  async function handleResend() {
    setResending(true)
    setResendMsg('')
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    setResendMsg(error ? error.message : 'Verification email sent. Please check your inbox.')
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-bg">
      {/* Ambient glow background */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[120px]" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Logos + Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-1 rounded-full bg-surface border border-border shadow-token-sm bounce-1">
              <img src={logo} alt="KP App Logo" className="w-20 h-20 rounded-full" />
            </div>
            <div className="w-px h-14 bg-border" />
            <div className="p-1 rounded-full bg-surface border border-border shadow-token-sm bounce-2">
              <img src={barangayLogo} alt="Barangay New Kababae" className="w-20 h-20 rounded-full bg-white" />
            </div>
          </div>
          <h1 className="text-ink font-sans text-2xl font-semibold">KP App</h1>
          <p className="text-ink-soft font-sans text-sm mt-1">
            Katarungang Pambarangay Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-3xl shadow-token-lg p-8 border border-border">
          <h2 className="text-ink font-sans text-xl font-semibold mb-6">
            Sign In
          </h2>

          {infoMsg && (
            <div className="bg-success-soft border border-success-strong/20 text-success-strong text-sm rounded-xl px-4 py-3 mb-4">
              {infoMsg}
            </div>
          )}

          {errorMsg && (
            <div className="bg-danger-soft border border-danger-strong/20 text-danger-strong text-sm rounded-xl px-4 py-3 mb-4">
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
            <div className="bg-info-soft border border-info-strong/20 text-info-strong text-sm rounded-xl px-4 py-3 mb-4">
              {resendMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-ink-soft font-sans text-sm mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-ink-soft font-sans text-sm">
                  Password
                </label>
                <Link to="/forgot-password" className="text-accent hover:text-accent-hover font-sans text-xs font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-xl px-4 py-2.5 pr-11 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover transition-all text-accent-ink font-sans font-semibold text-sm rounded-xl py-3 mt-2 disabled:opacity-50 shadow-token-md"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-ink-soft font-sans text-sm text-center mt-6">
            Don't have an account?{' '}
            <a href="/register" className="text-accent hover:text-accent-hover font-medium">
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login