import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'

const COLORS = {
  success: { bg: 'bg-success-soft', border: 'border-success-strong/30', icon: 'text-success-strong' },
  warning: { bg: 'bg-warning-soft', border: 'border-warning-strong/30', icon: 'text-warning-strong' },
  danger: { bg: 'bg-danger-soft', border: 'border-danger-strong/30', icon: 'text-danger-strong' },
  info: { bg: 'bg-info-soft', border: 'border-info-strong/30', icon: 'text-info-strong' },
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

      const unreadIds = (data || []).filter((n) => !n.is_read).map((n) => n.id)
      if (unreadIds.length > 0) {
        await supabase.from('complaint_notifications').update({ is_read: true }).in('id', unreadIds)
      }
    }
    load()
  }, [user])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <AppLayout title="Notifications">
      <div className="max-w-[700px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <p className="text-ink-soft text-sm">Updates about your complaints</p>
          {unreadCount > 0 && (
            <span className="bg-danger-soft text-danger-strong text-xs font-semibold px-3 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-14 text-ink-faint text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-14 text-center shadow-token-md">
            <div className="text-4xl mb-3">🔔</div>
            <div className="text-ink text-[15px] font-semibold mb-1.5">No notifications yet</div>
            <div className="text-ink-faint text-sm">You'll be notified here when your complaint status changes.</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {notifications.map((notif) => {
              const c = COLORS[notif.type] || COLORS.info
              return (
                <div
                  key={notif.id}
                  className={`rounded-2xl border p-4.5 flex gap-3.5 items-start shadow-token-sm ${
                    notif.is_read ? 'bg-surface-sunken border-border' : `${c.bg} ${c.border}`
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0 ${c.icon} font-bold`}>
                    {ICONS[notif.type] || ICONS.info}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2.5 mb-1">
                      <div className="text-sm font-bold text-ink">{notif.title || 'Notification'}</div>
                      {!notif.is_read && <span className="w-2 h-2 rounded-full bg-danger-strong flex-shrink-0" />}
                    </div>
                    <div className="text-sm text-ink-soft leading-relaxed mb-2">{notif.message}</div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-xs text-ink-faint">{timeAgo(notif.created_at)}</div>
                      {notif.complaints?.reference_number && (
                        <Link
                          to={`/track?ref=${notif.complaints.reference_number}`}
                          className="text-xs font-semibold text-accent border border-border bg-surface rounded-md px-3 py-1.5"
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