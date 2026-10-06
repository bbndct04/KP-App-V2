import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/layout/AdminLayout'

const COLORS = {
  success: { bg: 'bg-success-soft', border: 'border-success-strong/30', icon: 'text-success-strong' },
  warning: { bg: 'bg-warning-soft', border: 'border-warning-strong/30', icon: 'text-warning-strong' },
  danger: { bg: 'bg-danger-soft', border: 'border-danger-strong/30', icon: 'text-danger-strong' },
  info: { bg: 'bg-info-soft', border: 'border-info-strong/30', icon: 'text-info-strong' },
}

const ICONS = { success: '✓', danger: '!', warning: '⚠', info: 'ℹ' }

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000)
  const intervals = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]]
  for (const [label, secs] of intervals) {
    const count = Math.floor(seconds / secs)
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`
  }
  return 'just now'
}

function AdminNotifications() {
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
        .limit(100)
      setNotifications(data || [])
      setLoading(false)

      const unreadIds = (data || []).filter((n) => !n.is_read).map((n) => n.id)
      if (unreadIds.length > 0) {
        await supabase.from('complaint_notifications').update({ is_read: true }).in('id', unreadIds)
      }
    }
    load()
  }, [user])

  return (
    <AdminLayout title="Notifications">
      <div className="max-w-[760px] mx-auto">
        <p className="text-ink-soft text-[13.5px] mb-5">New complaints, today's hearings, and cases needing attention</p>

        {loading ? (
          <div className="text-center py-14 text-ink-faint text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-14 text-center shadow-token-md">
            <div className="text-4xl mb-3">🔔</div>
            <div className="text-ink text-[15px] font-semibold mb-1.5">No notifications yet</div>
            <div className="text-ink-faint text-[13px]">You'll be alerted here when residents file complaints or cases need attention.</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {notifications.map((n) => {
              const c = COLORS[n.type] || COLORS.info
              return (
                <div
                  key={n.id}
                  className={`rounded-2xl border p-4.5 flex gap-3.5 items-start shadow-token-sm ${
                    n.is_read ? 'bg-surface border-border' : `${c.bg} ${c.border}`
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0 ${c.icon} font-bold`}>
                    {ICONS[n.type] || ICONS.info}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2.5 mb-1">
                      <div className="text-sm font-bold text-ink">{n.title || 'Notification'}</div>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-danger-strong flex-shrink-0" />}
                    </div>
                    <div className="text-[13px] text-ink-soft leading-relaxed mb-2">{n.message}</div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-xs text-ink-faint">{timeAgo(n.created_at)}</div>
                      {n.complaint_id ? (
                        <Link
                          to={`/admin/complaints/${n.complaint_id}`}
                          className="text-xs font-semibold text-accent border border-border bg-surface rounded-md px-3 py-1.5"
                        >
                          Open case →
                        </Link>
                      ) : (
                        <Link
                          to="/admin/complaints"
                          className="text-xs font-semibold text-accent border border-border bg-surface rounded-md px-3 py-1.5"
                        >
                          View complaints →
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
    </AdminLayout>
  )
}

export default AdminNotifications