import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import logo from '../../assets/kp-app-logo.png'
import barangayLogo from '../../assets/barangay-newkababae-logo.jpg'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setLoading(false)
      setErrorMsg(error.message)
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

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-blue-950">
      {/* Ambient glow background */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-[120px]" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Logos + Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 bounce-1">
              <img src={logo} alt="KP App Logo" className="w-20 h-20 rounded-full" />
            </div>
            <div className="w-px h-14 bg-white/20" />
            <div className="p-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 bounce-2">
              <img src={barangayLogo} alt="Barangay New Kababae" className="w-20 h-20 rounded-full bg-white" />
            </div>
          </div>
          <h1 className="text-white font-sans text-2xl font-semibold drop-shadow-sm">KP App</h1>
          <p className="text-blue-200/70 font-sans text-sm mt-1">
            Katarungang Pambarangay Portal
          </p>
        </div>

        {/* Glass Card */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20 ring-1 ring-white/10">
          <h2 className="text-white font-sans text-xl font-semibold mb-6">
            Sign In
          </h2>

          {errorMsg && (
            <div className="bg-red-500/15 backdrop-blur-sm border border-red-400/30 text-red-100 text-sm rounded-xl px-4 py-3 mb-4">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-blue-100/90 font-sans text-sm mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-blue-200/40 rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-300/40 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-blue-100/90 font-sans text-sm mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-blue-200/40 rounded-xl px-4 py-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-300/40 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500/90 hover:bg-blue-500 backdrop-blur-sm transition-all text-white font-sans font-semibold text-sm rounded-xl py-3 mt-2 disabled:opacity-50 shadow-lg shadow-blue-500/30 border border-blue-400/30"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-blue-200/70 font-sans text-sm text-center mt-6">
            Don't have an account?{' '}
            <a href="/register" className="text-blue-300 hover:text-blue-200 font-medium">
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login