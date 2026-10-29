import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MdOutlinePerson,
  MdOutlineLock,
  MdOutlineNotifications,
  MdOutlineTranslate,
  MdOutlineDarkMode,
  MdOutlineLightMode,
  MdOutlineHelpOutline,
  MdLogout,
  MdArrowForward,
  MdArrowBack,
  MdOutlinePhotoCamera,
  MdOutlineVerified,
  MdOutlinePendingActions,
  MdOutlineLocationOn,
  MdOutlineSchedule,
  MdOutlineInfo,
} from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { passwordProblem } from '../../lib/accounts'
import { compressImage } from '../../lib/image'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/toastContext'
import { useT } from '../../i18n/LanguageContext'
import AppLayout from '../../components/layout/AppLayout'
import ProfileAvatar from '../../components/ProfileAvatar'
import { Button, Field, Input } from '../../components/ui'

function Section({ title, children }) {
  return (
    <div>
      <div className="text-ink-faint text-sm font-semibold px-1 mb-2">{title}</div>
      <div className="bg-surface border border-border rounded-2xl shadow-token-sm divide-y divide-border overflow-hidden">{children}</div>
    </div>
  )
}

function Row({ icon: Icon, label, value, onClick, to, danger = false, children }) {
  const inner = (
    <>
      <Icon className={`text-[22px] flex-shrink-0 ${danger ? 'text-danger-strong' : 'text-ink-soft'}`} aria-hidden="true" />
      <span className={`flex-1 text-[15px] font-medium ${danger ? 'text-danger-strong' : 'text-ink'}`}>{label}</span>
      {children}
      {value && <span className="text-ink-faint text-sm">{value}</span>}
      {(onClick || to) && !danger && <MdArrowForward className="text-ink-faint flex-shrink-0" aria-hidden="true" />}
    </>
  )
  const cls = 'w-full flex items-center gap-3.5 px-4 min-h-[56px] py-2 text-left'
  if (to) return <Link to={to} className={`${cls} hover:bg-surface-hover transition-colors`}>{inner}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={`${cls} hover:bg-surface-hover transition-colors`}>{inner}</button>
  return <div className={cls}>{inner}</div>
}

function Segmented({ value, options, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex p-1 rounded-lg bg-surface-sunken border border-border flex-shrink-0">
      {options.map((o) => {
        const Icon = o.icon
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`h-8 px-3 rounded-md text-sm font-semibold flex items-center gap-1.5 transition-colors ${
              active ? 'bg-surface text-ink shadow-token-sm' : 'text-ink-faint hover:text-ink-soft'
            }`}
          >
            {Icon && <Icon className="text-base" aria-hidden="true" />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function SubPage({ title, onBack, children }) {
  const { t } = useT()
  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start inline-flex items-center gap-1.5 text-accent text-sm font-semibold">
        <MdArrowBack aria-hidden="true" /> {t('Profile')}
      </button>
      <h2 className="text-ink text-xl font-bold">{title}</h2>
      {children}
    </div>
  )
}

function PersonalInfo({ verified, onBack }) {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const { t } = useT()
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    contact_number: profile?.contact_number || '',
    address: profile?.address || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const changes = { contact_number: form.contact_number.trim(), address: form.address.trim() }
    if (!verified) changes.full_name = form.full_name.trim()
    const { error: err } = await supabase.from('profiles').update(changes).eq('id', user.id)
    setSaving(false)
    if (err) return setError(err.message)
    await refreshProfile()
    toast.success(t('Your profile has been updated.'))
    onBack()
  }

  return (
    <SubPage title={t('Personal information')} onBack={onBack}>
      <form onSubmit={save} className="bg-surface border border-border rounded-2xl shadow-token-sm p-5 flex flex-col gap-4">
        <Field label={t('Full name')} required hint={verified ? t('Your name matches your verified ID. Visit the Barangay Hall to correct it.') : undefined}>
          <Input value={form.full_name} onChange={set('full_name')} required disabled={verified} autoComplete="name" />
        </Field>
        <Field label={t('Email')} hint={t('Your email is used to log in and cannot be changed here.')}>
          <Input value={user?.email || ''} disabled />
        </Field>
        <Field label={t('Contact number')}>
          <Input
            value={form.contact_number}
            onChange={set('contact_number')}
            type="tel"
            inputMode="tel"
            pattern="^(\+63|0)9\d{2}[- ]?\d{3}[- ]?\d{4}$"
            title={t('Enter a mobile number like 09171234567')}
            placeholder="09171234567"
            autoComplete="tel"
          />
        </Field>
        <Field label={t('Home address')}>
          <Input value={form.address} onChange={set('address')} placeholder="Purok, Street, Barangay New Kababae" autoComplete="street-address" />
        </Field>
        {error && (
          <div role="alert" className="bg-danger-soft border border-danger-strong/20 text-danger-strong text-sm rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? t('Saving...') : t('Save changes')}
        </Button>
      </form>
    </SubPage>
  )
}

function PasswordSecurity({ onBack }) {
  const { user } = useAuth()
  const toast = useToast()
  const { t } = useT()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function save(e) {
    e.preventDefault()
    setError('')
    if (!form.current) return setError(t('Enter your current password.'))
    const problem = passwordProblem(form.next)
    if (problem) return setError(t(problem))
    if (form.next !== form.confirm) return setError(t('Passwords do not match.'))

    setSaving(true)
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: form.current })
    if (verifyError) {
      setSaving(false)
      return setError(t('Your current password is incorrect.'))
    }
    const { error: err } = await supabase.auth.updateUser({ password: form.next })
    setSaving(false)
    if (err) return setError(err.message)
    toast.success(t('Your password has been changed.'))
    onBack()
  }

  return (
    <SubPage title={t('Password & security')} onBack={onBack}>
      <form onSubmit={save} className="bg-surface border border-border rounded-2xl shadow-token-sm p-5 flex flex-col gap-4">
        <Field label={t('Current password')} required>
          <Input type="password" value={form.current} onChange={set('current')} autoComplete="current-password" />
        </Field>
        <Field label={t('New password')} required hint={t('At least 8 characters, with letters and numbers.')}>
          <Input type="password" value={form.next} onChange={set('next')} autoComplete="new-password" />
        </Field>
        <Field label={t('Confirm new password')} required>
          <Input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
        </Field>
        {error && (
          <div role="alert" className="bg-danger-soft border border-danger-strong/20 text-danger-strong text-sm rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? t('Saving...') : t('Update password')}
        </Button>
      </form>
      <div className="flex gap-2.5 bg-info-soft border border-info-strong/20 text-info-strong text-sm rounded-xl px-4 py-3 leading-relaxed">
        <MdOutlineInfo className="text-xl flex-shrink-0 mt-0.5" aria-hidden="true" />
        {t('Never share your password. Barangay staff will never ask for it.')}
      </div>
    </SubPage>
  )
}

function Help({ onBack }) {
  const { t } = useT()
  const steps = [
    t('File your complaint in the app.'),
    t('Visit the Barangay Hall within 24 hours so it can be accepted.'),
    t('Attend the mediation and conciliation hearings on your schedule.'),
    t('Follow your case and get updates here in the app.'),
  ]
  return (
    <SubPage title={t('Help & barangay hours')} onBack={onBack}>
      <div className="bg-surface border border-border rounded-2xl shadow-token-sm p-5 flex flex-col gap-3 text-sm text-ink-soft">
        <div className="flex gap-3 items-start">
          <MdOutlineLocationOn className="text-xl text-accent flex-shrink-0" aria-hidden="true" />
          <span>{t('Barangay New Kababae Hall, Olongapo City')}</span>
        </div>
        <div className="flex gap-3 items-start">
          <MdOutlineSchedule className="text-xl text-accent flex-shrink-0" aria-hidden="true" />
          <span>{t('8:00 AM – 5:00 PM, Monday to Friday')}</span>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-2xl shadow-token-sm p-5">
        <div className="text-ink font-semibold mb-3">{t('How the process works')}</div>
        <ol className="flex flex-col gap-3">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink-soft leading-relaxed">
              <span className="w-6 h-6 rounded-full bg-accent-soft text-accent text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>
    </SubPage>
  )
}

function Profile() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { theme, setLight, setDark } = useTheme()
  const { t, lang, setLanguage } = useT()
  const toast = useToast()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [view, setView] = useState('main')
  const [stats, setStats] = useState({ total: 0, active: 0, closed: 0 })
  const [verified, setVerified] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [{ data }, { data: v }] = await Promise.all([
        supabase.from('complaints').select('status').eq('user_id', user.id),
        supabase.from('identity_verifications').select('user_id').eq('user_id', user.id).maybeSingle(),
      ])
      const total = data?.length || 0
      const closed = data?.filter((c) => ['closed', 'cfa_issued', 'dismissed', 'declined'].includes(c.status)).length || 0
      setStats({ total, closed, active: total - closed })
      setVerified(!!v)
    }
    load()
  }, [user])

  function go(next) {
    setView(next)
    document.querySelector('main')?.scrollTo({ top: 0 })
  }

  async function changePhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error(t('Please choose a photo.'))
    setUploading(true)
    try {
      const dataUrl = await compressImage(file, 512, 0.85)
      const blob = await (await fetch(dataUrl)).blob()
      const path = `${user.id}/avatar-${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg' })
      if (upErr) throw upErr
      const { error: dbErr } = await supabase.from('profiles').update({ avatar_path: path }).eq('id', user.id)
      if (dbErr) throw dbErr
      if (profile?.avatar_path) supabase.storage.from('avatars').remove([profile.avatar_path])
      await refreshProfile()
      toast.success(t('Profile photo updated.'))
    } catch (err) {
      toast.error(`${t('The photo could not be uploaded.')} ${err.message || ''}`)
    }
    setUploading(false)
  }

  async function removePhoto() {
    const old = profile?.avatar_path
    const { error } = await supabase.from('profiles').update({ avatar_path: null }).eq('id', user.id)
    if (error) return toast.error(error.message)
    if (old) supabase.storage.from('avatars').remove([old])
    await refreshProfile()
    toast.success(t('Profile photo removed.'))
  }

  async function logout() {
    await signOut()
    navigate('/login')
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(lang === 'tl' ? 'fil-PH' : 'en-US', { month: 'long', year: 'numeric' })
    : ''

  return (
    <AppLayout title="My Profile">
      <div className="max-w-[640px] mx-auto">
        {view === 'personal' && <PersonalInfo verified={verified} onBack={() => go('main')} />}
        {view === 'password' && <PasswordSecurity onBack={() => go('main')} />}
        {view === 'help' && <Help onBack={() => go('main')} />}

        {view === 'main' && (
          <div className="flex flex-col gap-5">
            <div className="bg-surface border border-border rounded-2xl shadow-token-sm p-5">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <ProfileAvatar path={profile?.avatar_path} name={profile?.full_name || user?.email} className="w-[72px] h-[72px] text-2xl" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    aria-label={t('Change profile photo')}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent text-accent-ink flex items-center justify-center ring-4 ring-surface disabled:opacity-60"
                  >
                    {uploading ? (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    ) : (
                      <MdOutlinePhotoCamera className="text-base" aria-hidden="true" />
                    )}
                  </button>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={changePhoto} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-ink text-lg font-bold truncate">{profile?.full_name || t('Resident')}</div>
                  <div className="text-ink-faint text-sm truncate">{user?.email}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {verified ? (
                      <span className="inline-flex items-center gap-1 bg-success-soft text-success-strong rounded-full px-2.5 py-0.5 text-xs font-semibold">
                        <MdOutlineVerified className="text-sm" aria-hidden="true" /> {t('ID verified')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-warning-soft text-warning-strong rounded-full px-2.5 py-0.5 text-xs font-semibold">
                        <MdOutlinePendingActions className="text-sm" aria-hidden="true" /> {t('ID not yet verified')}
                      </span>
                    )}
                    {profile?.avatar_path && (
                      <button type="button" onClick={removePhoto} className="text-xs font-semibold text-ink-faint hover:text-danger-strong">
                        {t('Remove photo')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-border text-center">
                {[
                  { label: t('Total cases'), val: stats.total, color: 'text-accent' },
                  { label: t('Active'), val: stats.active, color: 'text-warning-strong' },
                  { label: t('Closed'), val: stats.closed, color: 'text-success-strong' },
                ].map((s) => (
                  <div key={s.label}>
                    <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
                    <div className="text-ink-faint text-xs">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <Section title={t('Account')}>
              <Row icon={MdOutlinePerson} label={t('Personal information')} onClick={() => go('personal')} />
              <Row icon={MdOutlineLock} label={t('Password & security')} onClick={() => go('password')} />
              <Row icon={MdOutlineNotifications} label={t('Notifications')} to="/notifications" />
            </Section>

            <Section title={t('Preferences')}>
              <Row icon={MdOutlineTranslate} label={t('Language')}>
                <Segmented
                  label={t('Language')}
                  value={lang}
                  onChange={setLanguage}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'tl', label: 'Tagalog' },
                  ]}
                />
              </Row>
              <Row icon={theme === 'dark' ? MdOutlineDarkMode : MdOutlineLightMode} label={t('Theme')}>
                <Segmented
                  label={t('Theme')}
                  value={theme}
                  onChange={(v) => (v === 'dark' ? setDark() : setLight())}
                  options={[
                    { value: 'light', label: t('Light'), icon: MdOutlineLightMode },
                    { value: 'dark', label: t('Dark'), icon: MdOutlineDarkMode },
                  ]}
                />
              </Row>
            </Section>

            <Section title={t('Support')}>
              <Row icon={MdOutlineHelpOutline} label={t('Help & barangay hours')} onClick={() => go('help')} />
              <Row icon={MdLogout} label={t('Log Out')} onClick={logout} danger />
            </Section>

            {memberSince && <div className="text-center text-ink-faint text-xs">{t('Member since {date}', { date: memberSince })}</div>}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default Profile
