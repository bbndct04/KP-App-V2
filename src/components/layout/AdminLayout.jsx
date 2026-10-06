import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabaseClient'
import logo from '../../assets/kp-app-logo.png'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/complaints', label: 'Manage Complaints' },
  { to: '/admin/notifications', label: 'Notifications' },
  { to: '/admin/users', label: 'Manage Users' },
  { to: '/admin/analytics', label: 'Analytics' },
]

const TOAST_STYLES = {
  info: 'border-info-strong/40',
  warning: 'border-warning-strong/40',
  danger: 'border-danger-strong/40',
  success: 'border-success-strong/40',
}

function ThemeToggle() {
  const { theme, setLight, setDark } = useTheme()
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-sunken border border-border mb-2.5">
      <button
        onClick={setLight}
        aria-pressed={theme === 'light'}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-colors ${
          theme === 'light' ? 'bg-surface text-ink shadow-token-sm' : 'text-ink-faint hover:text-ink-soft'
        }`}
      >
        ☀ Light
      </button>
      <button
        onClick={setDark}
        aria-pressed={theme === 'dark'}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-colors ${
          theme === 'dark' ? 'bg-surface text-ink shadow-token-sm' : 'text-ink-faint hover:text-ink-soft'
        }`}
      >
        🌙 Dark
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

  const onNotificationsPage = location.pathname === '/admin/notifications'

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
  const badgeCount = onNotificationsPage ? 0 : unreadCount

  const SidebarContent = (
    <>
      <div className="px-4.5 py-3.5 border-b border-border flex items-center gap-3">
        <div className="p-0.5 rounded-full bg-surface-sunken border border-border">
          <img src={logo} alt="KP App logo" className="w-9 h-9 rounded-full" />
        </div>
        <div>
          <div className="text-ink font-sans text-sm font-bold">KP App</div>
          <div className="text-ink-faint font-sans text-[10px] uppercase tracking-wide">Admin Panel</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3.5 overflow-y-auto">
        <div className="text-ink-faint font-sans text-[10px] font-bold uppercase tracking-wide px-1.5 pb-1.5 pt-2">Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent-soft text-accent border border-accent/30 shadow-token-sm'
                  : 'text-ink-soft hover:bg-surface-hover hover:text-ink border border-transparent'
              }`
            }
          >
            {item.label}
            {item.to === '/admin/notifications' && badgeCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-danger-strong text-white text-[11px] font-bold flex items-center justify-center">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <ThemeToggle />
        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1">
          <div className="w-[34px] h-[34px] rounded-full bg-accent flex items-center justify-center text-accent-ink text-sm font-bold flex-shrink-0 shadow-token-sm">
            {firstInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-ink text-[13px] font-semibold truncate">{profile?.full_name || user?.email}</div>
            <div className="text-ink-faint text-[11px] capitalize">{profile?.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-ink-soft hover:text-ink hover:bg-surface-hover rounded-lg px-2.5 py-2 text-sm font-medium transition-colors"
        >
          Log Out
        </button>
      </div>
    </>
  )

  return (
    <div className="h-screen relative flex bg-bg overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <aside className="hidden md:flex w-[240px] h-full bg-surface border-r border-border flex-col relative z-10">
        {SidebarContent}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[260px] h-full bg-surface border-r border-border flex flex-col z-50 shadow-token-lg">
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col relative z-10 min-h-0 min-w-0">
        <header className="h-16 bg-surface border-b border-border flex items-center gap-3 px-4 md:px-7 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="md:hidden w-9 h-9 rounded-lg bg-surface-sunken border border-border flex items-center justify-center text-ink"
          >
            ☰
          </button>
          <div className="text-ink font-sans text-base md:text-lg font-bold truncate">{title}</div>
          <div className="flex-1" />
          <NavLink
            to="/admin/notifications"
            aria-label={badgeCount > 0 ? `Notifications, ${badgeCount} unread` : 'Notifications'}
            className="relative w-9 h-9 rounded-lg bg-surface-sunken border border-border flex items-center justify-center text-ink-soft hover:bg-surface-hover transition-colors flex-shrink-0"
          >
            🔔
            {badgeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger-strong text-white text-[10px] font-bold flex items-center justify-center">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </NavLink>
        </header>
        <main className="flex-1 p-4 md:p-7 overflow-y-auto min-w-0">{children}</main>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 w-[calc(100%-2rem)] max-w-[360px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`bg-surface border-2 ${TOAST_STYLES[t.type] || TOAST_STYLES.info} rounded-xl p-4 shadow-token-lg`}
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="text-ink text-sm font-bold">{t.title || 'Notification'}</div>
              <button
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss"
                className="text-ink-faint hover:text-ink text-sm leading-none"
              >
                ✕
              </button>
            </div>
            <div className="text-ink-soft text-[13px] leading-relaxed mb-2.5">{t.message}</div>
            {t.complaint_id && (
              <button
                onClick={() => {
                  dismissToast(t.id)
                  navigate(`/admin/complaints/${t.complaint_id}`)
                }}
                className="text-accent text-xs font-semibold"
              >
                Open case →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminLayout