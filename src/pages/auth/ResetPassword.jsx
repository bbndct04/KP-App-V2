import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import logo from '../../assets/kp-app-logo.png'

function ResetPassword() {
  const navigate = useNavigate()
  const [checkingSession, setCheckingSession] = useState(true)
  const [validLink, setValidLink] = useState(false)

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function checkSession() {
      // Supabase's client auto-exchanges the recovery token in the URL for a session
      // on load. If that succeeded, getSession() returns it; if the link was invalid
      // or expired, there's no session and we show an error instead of a broken form.
      const { data } = await supabase.auth.getSession()
      setValidLink(!!data.session)
      setCheckingSession(false)
    }
    checkSession()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    await supabase.auth.signOut()
    navigate('/login', { state: { message: 'Password updated. Please sign in with your new password.' } })
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-bg">
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[120px]" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-1 rounded-full bg-surface border border-border shadow-token-sm mb-4">
            <img src={logo} alt="KP App Logo" className="w-20 h-20 rounded-full" />
          </div>
          <h1 className="text-ink font-sans text-2xl font-semibold">KP App</h1>
          <p className="text-ink-soft font-sans text-sm mt-1">Katarungang Pambarangay Portal</p>
        </div>

        <div className="bg-surface rounded-3xl shadow-token-lg p-8 border border-border">
          {checkingSession ? (
            <div className="text-center py-6 text-ink-faint text-sm">Verifying your link...</div>
          ) : !validLink ? (
            <div className="text-center py-2">
              <div className="w-[64px] h-[64px] bg-danger-soft border border-danger-strong/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                ⚠️
              </div>
              <h2 className="text-ink font-sans text-xl font-semibold mb-2">Link expired or invalid</h2>
              <p className="text-ink-soft text-sm leading-relaxed mb-5">
                This password reset link is no longer valid. Reset links expire after a short time — please request a new one.
              </p>
              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full bg-accent hover:bg-accent-hover text-accent-ink font-sans font-semibold text-sm rounded-xl py-3 shadow-token-md"
              >
                Request a new link
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-ink font-sans text-xl font-semibold mb-1.5">Set a new password</h2>
              <p className="text-ink-soft text-sm mb-6">Choose a new password for your account.</p>

              {error && (
                <div className="bg-danger-soft border border-danger-strong/20 text-danger-strong text-sm rounded-xl px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-ink-soft font-sans text-sm mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                      autoComplete="new-password"
                      minLength={8}
                      className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-xl px-4 py-2.5 pr-11 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft text-sm"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-ink-soft font-sans text-sm mb-1.5">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
                    placeholder="Re-enter new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-accent hover:bg-accent-hover transition-all text-accent-ink font-sans font-semibold text-sm rounded-xl py-3 mt-2 disabled:opacity-50 shadow-token-md"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPassword