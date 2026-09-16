import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/kp-app-logo.png'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/complaints', label: 'Manage Complaints' },
  { to: '/admin/users', label: 'Manage Users' },
  { to: '/admin/analytics', label: 'Analytics' },
]

function AdminLayout({ title, children }) {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  const firstInitial = (profile?.full_name || user?.email || '?').charAt(0).toUpperCase()

  return (
    <div className="h-screen relative flex bg-blue-950 overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />

      <aside className="w-[240px] h-full bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col relative z-10">
        <div className="px-4.5 py-3.5 border-b border-white/10 flex items-center gap-3">
          <div className="p-0.5 rounded-full bg-white/10 border border-white/20">
            <img src={logo} alt="KP App" className="w-9 h-9 rounded-full" />
          </div>
          <div>
            <div className="text-white font-sans text-sm font-bold">KP App</div>
            <div className="text-white/40 font-sans text-[10px] uppercase tracking-wide">Admin Panel</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3.5 overflow-y-auto">
          <div className="text-white/30 font-sans text-[10px] font-bold uppercase tracking-wide px-1.5 pb-1.5 pt-2">Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1">
            <div className="w-[34px] h-[34px] rounded-full bg-blue-500/80 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 border border-blue-300/30">
              {firstInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-[13px] font-semibold truncate">{profile?.full_name || user?.email}</div>
              <div className="text-white/40 text-[11px] capitalize">{profile?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-white/60 hover:text-white hover:bg-white/5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors"
          >
            Log Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col relative z-10 min-h-0">
        <header className="h-16 bg-white/5 backdrop-blur-2xl border-b border-white/10 flex items-center gap-4 px-7 flex-shrink-0">
          <div className="text-white font-sans text-lg font-bold">{title}</div>
        </header>
        <main className="flex-1 p-7 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout