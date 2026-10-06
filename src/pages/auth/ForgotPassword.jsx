import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MdArrowBack, MdOutlineMarkEmailUnread } from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import logo from '../../assets/kp-app-logo.png'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
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
          {!sent ? (
            <>
              <h2 className="text-ink font-sans text-xl font-semibold mb-1.5">Forgot Password</h2>
              <p className="text-ink-soft text-sm mb-6 leading-relaxed">
                Enter the email address on your account and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="bg-danger-soft border border-danger-strong/20 text-danger-strong text-sm rounded-xl px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-ink-soft font-sans text-sm mb-1.5">Email</label>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent-hover transition-all text-accent-ink font-sans font-semibold text-sm rounded-xl py-3 mt-2 disabled:opacity-50 shadow-token-md"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-2">
              <div className="w-[64px] h-[64px] bg-success-soft border border-success-strong/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                <MdOutlineMarkEmailUnread className="text-3xl text-success-strong" aria-hidden="true" />
              </div>
              <h2 className="text-ink font-sans text-xl font-semibold mb-2">Check your email</h2>
              <p className="text-ink-soft text-sm leading-relaxed mb-1">We sent a reset link to</p>
              <p className="text-ink font-semibold text-sm mb-4">{email}</p>
              <p className="text-ink-faint text-sm leading-relaxed">
                Click the link in that email to set a new password. It may take a minute to arrive.
              </p>
            </div>
          )}

          <p className="text-ink-soft font-sans text-sm text-center mt-6">
            <Link to="/login" className="text-accent hover:text-accent-hover font-medium inline-flex items-center gap-1">
              <MdArrowBack aria-hidden="true" /> Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword