import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import logo from '../../assets/kp-app-logo.png'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/complaints', label: 'Manage Complaints' },
  { to: '/admin/users', label: 'Manage Users' },
  { to: '/admin/analytics', label: 'Analytics' },
]

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
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  const firstInitial = (profile?.full_name || user?.email || '?').charAt(0).toUpperCase()

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
              `block px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent-soft text-accent border border-accent/30 shadow-token-sm'
                  : 'text-ink-soft hover:bg-surface-hover hover:text-ink border border-transparent'
              }`
            }
          >
            {item.label}
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

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-[240px] h-full bg-surface border-r border-border flex-col relative z-10">
        {SidebarContent}
      </aside>

      {/* MOBILE DRAWER */}
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
        </header>
        <main className="flex-1 p-4 md:p-7 overflow-y-auto min-w-0">{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout