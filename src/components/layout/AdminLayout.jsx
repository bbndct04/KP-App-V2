import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  MdOutlineDashboard,
  MdOutlineAssignment,
  MdOutlineNotifications,
  MdOutlineManageAccounts,
  MdOutlineInsights,
  MdOutlineLightMode,
  MdOutlineDarkMode,
  MdOutlineInfo,
  MdOutlineWarningAmber,
  MdOutlineErrorOutline,
  MdOutlineCheckCircle,
  MdMenu,
  MdLogout,
  MdClose,
} from 'react-icons/md'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabaseClient'
import logo from '../../assets/kp-app-logo.png'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: MdOutlineDashboard },
  { to: '/admin/complaints', label: 'Manage Complaints', icon: MdOutlineAssignment },
  { to: '/admin/notifications', label: 'Notifications', icon: MdOutlineNotifications },
  { to: '/admin/users', label: 'Manage Users', icon: MdOutlineManageAccounts },
  { to: '/admin/analytics', label: 'Analytics', icon: MdOutlineInsights },
]

const TOAST = {
  info: { border: 'border-info-strong/40', icon: MdOutlineInfo, color: 'text-info-strong' },
  warning: { border: 'border-warning-strong/40', icon: MdOutlineWarningAmber, color: 'text-warning-strong' },
  danger: { border: 'border-danger-strong/40', icon: MdOutlineErrorOutline, color: 'text-danger-strong' },
  success: { border: 'border-success-strong/40', icon: MdOutlineCheckCircle, color: 'text-success-strong' },
}

function ThemeToggle() {
  const { theme, setLight, setDark } = useTheme()
  const btn = (active) =>
    `flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md text-sm font-semibold transition-colors ${
      active ? 'bg-surface text-ink shadow-token-sm' : 'text-ink-faint hover:text-ink-soft'
    }`
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-sunken border border-border mb-2.5">
      <button onClick={setLight} aria-pressed={theme === 'light'} className={btn(theme === 'light')}>
        <MdOutlineLightMode className="text-lg" aria-hidden="true" /> Light
      </button>
      <button onClick={setDark} aria-pressed={theme === 'dark'} className={btn(theme === 'dark')}>
        <MdOutlineDarkMode className="text-lg" aria-hidden="true" /> Dark
      </button>
    </div>
  )
}

function AdminLayout({ title, children }) {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [toasts, setToasts] = useState([])

  const badgeCount = location.pathname === '/admin/notifications' ? 0 : unreadCount

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  function dismissToast(id) {
    setToasts((t) => t.filter((x) => x.id !== id))
  }

  useEffect(() => {
    if (!user) return

    async function loadUnread() {
      const { count } = await supabase
        .from('complaint_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      setUnreadCount(count || 0)
    }
    loadUnread()

    const channel = supabase
      .channel(`admin-notif-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'complaint_notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new
          setUnreadCount((c) => c + 1)
          setToasts((t) => [...t.slice(-2), n])
          setTimeout(() => dismissToast(n.id), 7000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const firstInitial = (profile?.full_name || user?.email || '?').charAt(0).toUpperCase()
  const close = () => setMobileOpen(false)

  const SidebarContent = (
    <>
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <img src={logo} alt="KP App logo" className="w-10 h-10 rounded-full" />
        <div>
          <div className="text-ink text-base font-bold">KP App</div>
          <div className="text-ink-faint text-xs uppercase tracking-wide">Admin Panel</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="text-ink-faint text-xs font-bold uppercase tracking-wide px-3 pb-2">Menu</div>
        {navItems.map((item) => {
          const Icon = item.icon
          const showBadge = item.to === '/admin/notifications' && badgeCount > 0
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={close}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-[15px] font-medium transition-colors ${
                  isActive ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:bg-surface-hover hover:text-ink'
                }`
              }
            >
              <Icon className="text-[22px] flex-shrink-0" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-danger-strong text-white text-xs font-bold flex items-center justify-center">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <ThemeToggle />
        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-accent-ink text-sm font-bold flex-shrink-0">
            {firstInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-ink text-sm font-semibold truncate">{profile?.full_name || user?.email}</div>
            <div className="text-ink-faint text-xs capitalize">{profile?.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 text-ink-soft hover:text-ink hover:bg-surface-hover rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors"
        >
          <MdLogout className="text-[22px]" aria-hidden="true" /> Log Out
        </button>
      </div>
    </>
  )

  return (
    <div className="h-app relative flex bg-bg overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <aside className="hidden md:flex w-[260px] h-full bg-surface border-r border-border flex-col relative z-10">
        {SidebarContent}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <aside className="relative w-[280px] h-full bg-surface border-r border-border flex flex-col z-50 shadow-token-lg">
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col relative z-10 min-h-0 min-w-0">
        <header className="h-16 bg-surface border-b border-border flex items-center gap-3 px-4 md:px-7 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="md:hidden w-10 h-10 rounded-lg hover:bg-surface-hover flex items-center justify-center text-ink"
          >
            <MdMenu className="text-2xl" aria-hidden="true" />
          </button>
          <div className="text-ink text-lg font-bold truncate">{title}</div>
          <div className="flex-1" />
          <NavLink
            to="/admin/notifications"
            aria-label={badgeCount > 0 ? `Notifications, ${badgeCount} unread` : 'Notifications'}
            className="relative w-10 h-10 rounded-lg hover:bg-surface-hover flex items-center justify-center text-ink-soft transition-colors flex-shrink-0"
          >
            <MdOutlineNotifications className="text-2xl" aria-hidden="true" />
            {badgeCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger-strong text-white text-[11px] font-bold flex items-center justify-center">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </NavLink>
        </header>
        <main className="flex-1 p-4 md:p-7 overflow-y-auto min-w-0">{children}</main>
      </div>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 w-[calc(100%-2rem)] max-w-[380px]">
        {toasts.map((t) => {
          const s = TOAST[t.type] || TOAST.info
          const Icon = s.icon
          return (
            <div key={t.id} role="status" className={`bg-surface border-2 ${s.border} rounded-xl p-4 shadow-token-lg flex gap-3`}>
              <Icon className={`text-2xl flex-shrink-0 ${s.color}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="text-ink text-sm font-bold">{(t.title || '').replace(/^[^\p{L}\p{N}]+/u, '') || 'Notification'}</div>
                  <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="text-ink-faint hover:text-ink">
                    <MdClose className="text-lg" aria-hidden="true" />
                  </button>
                </div>
                <div className="text-ink-soft text-sm leading-relaxed mb-2">{t.message}</div>
                {t.complaint_id && (
                  <button
                    onClick={() => {
                      dismissToast(t.id)
                      navigate(`/admin/complaints/${t.complaint_id}`)
                    }}
                    className="text-accent text-sm font-semibold"
                  >
                    Open case →
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AdminLayout
