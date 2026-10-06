import { NavLink } from 'react-router-dom'

function BottomNav({ items }) {
  return (
    <nav
      aria-label="Main navigation"
      className="md:hidden flex-shrink-0 relative z-20 bg-surface border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-end justify-around px-1">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.to} className="flex-1 flex justify-center">
              <NavLink
                to={item.to}
                end={item.end}
                aria-label={item.badge > 0 ? `${item.label}, ${item.badge} new` : item.label}
                className="flex flex-col items-center min-w-[64px] pb-2 pt-1.5 group"
              >
                {({ isActive }) =>
                  item.primary ? (
                    <>
                      <span className="relative -mt-6 w-14 h-14 rounded-full bg-accent text-accent-ink shadow-token-lg flex items-center justify-center ring-4 ring-surface">
                        <Icon className="text-3xl" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-semibold mt-1 text-accent">{item.label}</span>
                    </>
                  ) : (
                    <>
                      <span
                        className={`relative h-8 w-14 rounded-full flex items-center justify-center transition-colors ${
                          isActive ? 'bg-accent-soft text-accent' : 'text-ink-soft group-active:bg-surface-hover'
                        }`}
                      >
                        <Icon className="text-2xl" aria-hidden="true" />
                        {item.badge > 0 && (
                          <span className="absolute top-0 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-danger-strong text-white text-[11px] font-bold flex items-center justify-center">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </span>
                      <span className={`text-xs mt-0.5 ${isActive ? 'font-semibold text-accent' : 'font-medium text-ink-soft'}`}>
                        {item.label}
                      </span>
                    </>
                  )
                }
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default BottomNav
