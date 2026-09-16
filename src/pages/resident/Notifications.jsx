import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'

const COLORS = {
  success: { bg: 'bg-green-500/10', border: 'border-green-400/30', icon: 'text-green-400' },
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-400/30', icon: 'text-amber-400' },
  danger: { bg: 'bg-red-500/10', border: 'border-red-400/30', icon: 'text-red-400' },
  info: { bg: 'bg-sky-500/10', border: 'border-sky-400/30', icon: 'text-sky-400' },
}

const ICONS = {
  success: '✓',
  danger: '✕',
  warning: '⚠',
  info: 'ℹ',
}

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000)
  const intervals = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [label, secs] of intervals) {
    const count = Math.floor(seconds / secs)
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`
  }
  return 'just now'
}

function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase
        .from('complaint_notifications')
        .select('*, complaints(reference_number)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setNotifications(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <AppLayout title="Notifications">
      <div className="max-w-[700px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <p className="text-blue-200/60 text-[13.5px]">Updates about your complaints</p>
          {unreadCount > 0 && (
            <span className="bg-red-500/20 text-red-300 text-xs font-semibold px-3 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-14 text-blue-200/50 text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-14 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <div className="text-white text-[15px] font-semibold mb-1.5">No notifications yet</div>
            <div className="text-blue-200/50 text-[13px]">You'll be notified here when your complaint status changes.</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {notifications.map((notif) => {
              const c = COLORS[notif.type] || COLORS.info
              return (
                <div
                  key={notif.id}
                  className={`rounded-2xl border p-4.5 flex gap-3.5 items-start backdrop-blur-xl ${
                    notif.is_read ? 'bg-white/5 border-white/10' : `${c.bg} ${c.border}`
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 ${c.icon} font-bold`}>
                    {ICONS[notif.type] || ICONS.info}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2.5 mb-1">
                      <div className="text-sm font-bold text-white">{notif.title || 'Notification'}</div>
                      {!notif.is_read && <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />}
                    </div>
                    <div className="text-[13px] text-blue-100/70 leading-relaxed mb-2">{notif.message}</div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-xs text-blue-200/40">{timeAgo(notif.created_at)}</div>
                      {notif.complaints?.reference_number && (
                        <Link
                          to={`/track?ref=${notif.complaints.reference_number}`}
                          className="text-xs font-semibold text-blue-300 border border-white/15 bg-white/5 rounded-md px-3 py-1.5"
                        >
                          Track Complaint →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default Notifications