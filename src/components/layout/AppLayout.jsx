import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  MdOutlineDashboard,
  MdOutlineNoteAdd,
  MdOutlineFolderCopy,
  MdOutlineManageSearch,
  MdOutlineNotifications,
  MdOutlineAccountCircle,
  MdOutlineLightMode,
  MdOutlineDarkMode,
  MdMenu,
  MdLogout,
} from 'react-icons/md'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabaseClient'
import logo from '../../assets/kp-app-logo.png'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: MdOutlineDashboard },
  { to: '/complaints/new', label: 'Submit Complaint', icon: MdOutlineNoteAdd },
  { to: '/my-reports', label: 'My Reports', icon: MdOutlineFolderCopy },
  { to: '/track', label: 'Track Status', icon: MdOutlineManageSearch },
  { to: '/notifications', label: 'Notifications', icon: MdOutlineNotifications },
]

const accountItems = [{ to: '/profile', label: 'My Profile', icon: MdOutlineAccountCircle }]

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

function NavItem({ item, badge, onClick }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-[15px] font-medium transition-colors ${
          isActive ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:bg-surface-hover hover:text-ink'
        }`
      }
    >
      <Icon className="text-[22px] flex-shrink-0" aria-hidden="true" />
      <span className="flex-1">{item.label}</span>
      {badge > 0 && (
        <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-danger-strong text-white text-xs font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </NavLink>
  )
}

function AppLayout({ title, children }) {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const badgeCount = location.pathname === '/notifications' ? 0 : unreadCount

  async function handleLogout() {
    await signOut()
    navigate('/login')
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
      .channel(`notif-badge-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'complaint_notifications', filter: `user_id=eq.${user.id}` },
        () => setUnreadCount((c) => c + 1)
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
          <div className="text-ink-faint text-xs uppercase tracking-wide">Brgy. New Kababae</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="text-ink-faint text-xs font-bold uppercase tracking-wide px-3 pb-2">Menu</div>
        {navItems.map((item) => (
          <NavItem key={item.to} item={item} onClick={close} badge={item.to === '/notifications' ? badgeCount : 0} />
        ))}
        <div className="text-ink-faint text-xs font-bold uppercase tracking-wide px-3 pb-2 pt-4">Account</div>
        {accountItems.map((item) => (
          <NavItem key={item.to} item={item} onClick={close} />
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <ThemeToggle />
        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-accent-ink text-sm font-bold flex-shrink-0">
            {firstInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-ink text-sm font-semibold truncate">{profile?.full_name || user?.email}</div>
            <div className="text-ink-faint text-xs capitalize">{profile?.role || 'resident'}</div>
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
    <div className="h-screen relative flex bg-bg overflow-hidden">
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
            to="/notifications"
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
          <NavLink
            to="/profile"
            aria-label="My profile"
            className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-accent-ink text-sm font-bold flex-shrink-0"
          >
            {firstInitial}
          </NavLink>
        </header>
        <main className="flex-1 p-4 md:p-7 overflow-y-auto overflow-x-hidden min-w-0">{children}</main>
      </div>
    </div>
  )
}

export default AppLayout
