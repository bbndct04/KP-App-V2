import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/kp-app-logo.png'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/complaints/new', label: 'Submit Complaint' },
  { to: '/my-reports', label: 'My Reports' },
  { to: '/track', label: 'Track Status' },
  { to: '/notifications', label: 'Notifications' },
]

function AppLayout({ title, children }) {
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
      <div className="px-4.5 py-3.5 border-b border-white/10 flex items-center gap-3">
        <div className="p-0.5 rounded-full bg-white/10 border border-white/20">
          <img src={logo} alt="KP App" className="w-9 h-9 rounded-full" />
        </div>
        <div>
          <div className="text-white font-sans text-sm font-bold">KP App</div>
          <div className="text-white/40 font-sans text-[10px] uppercase tracking-wide">Brgy. New Kababae</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3.5 overflow-y-auto">
        <div className="text-white/30 font-sans text-[10px] font-bold uppercase tracking-wide px-1.5 pb-1.5 pt-2">Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all backdrop-blur-sm ${
                isActive
                  ? 'bg-blue-500/30 text-white border border-blue-400/30 shadow-md shadow-blue-500/10'
                  : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
        <div className="text-white/30 font-sans text-[10px] font-bold uppercase tracking-wide px-1.5 pb-1.5 pt-3.5">Account</div>
        <NavLink
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `block px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all backdrop-blur-sm ${
              isActive
                ? 'bg-blue-500/30 text-white border border-blue-400/30 shadow-md shadow-blue-500/10'
                : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
            }`
          }
        >
          My Profile
        </NavLink>
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1">
          <div className="w-[34px] h-[34px] rounded-full bg-blue-500/80 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 border border-blue-300/30">
            {firstInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-[13px] font-semibold truncate">{profile?.full_name || user?.email}</div>
            <div className="text-white/40 text-[11px] capitalize">{profile?.role || 'resident'}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-white/60 hover:text-white hover:bg-white/5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors"
        >
          Log Out
        </button>
      </div>
    </>
  )

  return (
    <div className="h-screen relative flex bg-blue-950 overflow-hidden">
      {/* Ambient glow background */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-[240px] h-full bg-white/5 backdrop-blur-2xl border-r border-white/10 flex-col relative z-10">
        {SidebarContent}
      </aside>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[260px] h-full bg-blue-950/98 backdrop-blur-2xl border-r border-white/10 flex flex-col z-50">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* MAIN */}
      <div className="flex-1 flex flex-col relative z-10 min-h-0 min-w-0">
        <header className="h-16 bg-white/5 backdrop-blur-2xl border-b border-white/10 flex items-center gap-3 px-4 md:px-7 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white"
          >
            ☰
          </button>
          <div className="text-white font-sans text-base md:text-lg font-bold truncate">{title}</div>
          <div className="flex-1" />
          <NavLink to="/notifications" className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/15 transition-colors flex-shrink-0">
            🔔
          </NavLink>
          <div className="w-[34px] h-[34px] rounded-full bg-blue-500/80 flex items-center justify-center text-white text-sm font-bold border border-blue-300/30 flex-shrink-0">
            {firstInitial}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-7 overflow-y-auto overflow-x-hidden min-w-0">{children}</main>
      </div>
    </div>
  )
}

export default AppLayout