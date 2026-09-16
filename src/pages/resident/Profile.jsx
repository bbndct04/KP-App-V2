import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'

function Profile() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 })

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [contact, setContact] = useState('')
  const [address, setAddress] = useState('')
  const [officialTitle, setOfficialTitle] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setContact(profile.contact_number || '')
      setAddress(profile.address || '')
      setOfficialTitle(profile.official_title || '')
    }
    if (user) setEmail(user.email || '')
  }, [profile, user])

  useEffect(() => {
    async function loadStats() {
      if (!user) return
      const { data } = await supabase.from('complaints').select('status').eq('user_id', user.id)
      const total = data?.length || 0
      const resolved = data?.filter((c) => c.status === 'resolved').length || 0
      const pending = data?.filter((c) => c.status === 'pending').length || 0
      setStats({ total, resolved, pending })
    }
    loadStats()
  }, [user])

  const initials = (fullName || user?.email || '??').substring(0, 2).toUpperCase()
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''
  const isVerified = !!user?.email_confirmed_at

  async function handleProfileSave(e) {
    e.preventDefault()
    setProfileMsg('')
    setSavingProfile(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        contact_number: contact,
        address,
        official_title: profile?.role === 'admin' ? officialTitle : profile?.official_title,
      })
      .eq('id', user.id)

    setSavingProfile(false)
    setProfileMsg(error ? error.message : 'Profile updated successfully.')
  }

  async function handlePasswordSave(e) {
    e.preventDefault()
    setPasswordError('')
    setPasswordMsg('')

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordMsg('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <AppLayout title="My Profile">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5 items-start">
        {/* LEFT — Avatar + Stats */}
        <div className="flex flex-col gap-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-blue-500/90 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3.5 border-4 border-white/15">
              {initials}
            </div>
            <div className="text-white text-[17px] font-bold mb-1">{fullName || 'Resident'}</div>
            <div className="text-blue-200/50 text-[13px] capitalize mb-3.5">
              {profile?.official_title || profile?.role || 'resident'}
            </div>

            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 bg-green-500/15 text-green-300 border border-green-400/30 rounded-full px-3 py-1 text-xs font-semibold">
                ✓ Verified Account
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-300 border border-amber-400/30 rounded-full px-3 py-1 text-xs font-semibold">
                ⚠ Unverified
              </span>
            )}

            <div className="border-t border-white/10 mt-4 pt-4">
              <div className="text-[11px] font-bold uppercase tracking-wide text-blue-200/40 mb-3 text-left">
                My Report Summary
              </div>
              {[
                { label: 'Total Reports', val: stats.total, color: 'text-blue-300', bg: 'bg-blue-500/10' },
                { label: 'Resolved', val: stats.resolved, color: 'text-green-300', bg: 'bg-green-500/10' },
                { label: 'Pending', val: stats.pending, color: 'text-amber-300', bg: 'bg-amber-500/10' },
              ].map((s) => (
                <div key={s.label} className={`flex justify-between items-center px-3 py-2 rounded-lg mb-1.5 ${s.bg}`}>
                  <span className="text-[13px] text-blue-100/70 font-medium">{s.label}</span>
                  <span className={`text-[17px] font-bold ${s.color}`}>{s.val}</span>
                </div>
              ))}
            </div>

            <div className="mt-3.5 text-xs text-blue-200/40">Member since {memberSince}</div>
          </div>
        </div>

        {/* RIGHT — Edit Forms */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Personal Information */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden">
            <div className="px-5.5 py-4 border-b border-white/10 flex items-center gap-2.5">
              <span className="text-blue-300">👤</span>
              <div className="text-white text-[15px] font-semibold">Personal Information</div>
            </div>
            <form onSubmit={handleProfileSave} className="p-5.5">
              {profileMsg && (
                <div className="bg-green-500/15 border border-green-400/30 text-green-200 text-sm rounded-lg px-4 py-2.5 mb-4">
                  {profileMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-blue-200/50 mb-1.5">Full Name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-blue-200/50 mb-1.5">Email Address</label>
                  <input
                    value={email}
                    disabled
                    className="w-full bg-white/5 border border-white/10 text-blue-200/50 rounded-lg px-3.5 py-2.5 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-blue-200/50 mb-1.5">Contact Number</label>
                  <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="09XX-XXX-XXXX"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/30 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-blue-200/50 mb-1.5">
                    {profile?.role === 'admin' ? 'Official Title' : 'Role'}
                  </label>
                  {profile?.role === 'admin' ? (
                    <input
                      value={officialTitle}
                      onChange={(e) => setOfficialTitle(e.target.value)}
                      placeholder="e.g. Punong Barangay, Lupon Secretary"
                      className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/30 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    />
                  ) : (
                    <input
                      value="Resident"
                      disabled
                      className="w-full bg-white/5 border border-white/10 text-blue-200/50 rounded-lg px-3.5 py-2.5 text-sm cursor-not-allowed"
                    />
                  )}
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-blue-200/50 mb-1.5">Home Address</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Purok, Street, Barangay New Kababae"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/30 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full sm:w-auto bg-blue-500/90 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg px-7 py-2.5 border border-blue-400/30 shadow-lg shadow-blue-500/20"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden">
            <div className="px-5.5 py-4 border-b border-white/10 flex items-center gap-2.5">
              <span className="text-blue-300">🔒</span>
              <div className="text-white text-[15px] font-semibold">Change Password</div>
            </div>
            <form onSubmit={handlePasswordSave} className="p-5.5">
              {passwordError && (
                <div className="bg-red-500/15 border border-red-400/30 text-red-200 text-sm rounded-lg px-4 py-2.5 mb-4">
                  {passwordError}
                </div>
              )}
              {passwordMsg && (
                <div className="bg-green-500/15 border border-green-400/30 text-green-200 text-sm rounded-lg px-4 py-2.5 mb-4">
                  {passwordMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-blue-200/50 mb-1.5">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/30 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-blue-200/50 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/30 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-blue-200/50 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/30 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full sm:w-auto bg-blue-500/90 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg px-7 py-2.5 border border-blue-400/30 shadow-lg shadow-blue-500/20"
              >
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default Profile