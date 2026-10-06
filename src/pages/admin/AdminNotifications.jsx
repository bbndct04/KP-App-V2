import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MdOutlineInfo,
  MdOutlineWarningAmber,
  MdOutlineErrorOutline,
  MdOutlineCheckCircle,
  MdOutlineNotifications,
  MdArrowForward,
} from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/layout/AdminLayout'
import { Card, EmptyState, Skeleton } from '../../components/ui'

const TYPES = {
  info: { icon: MdOutlineInfo, color: 'text-info-strong', bg: 'bg-info-soft', border: 'border-info-strong/30' },
  warning: { icon: MdOutlineWarningAmber, color: 'text-warning-strong', bg: 'bg-warning-soft', border: 'border-warning-strong/30' },
  danger: { icon: MdOutlineErrorOutline, color: 'text-danger-strong', bg: 'bg-danger-soft', border: 'border-danger-strong/30' },
  success: { icon: MdOutlineCheckCircle, color: 'text-success-strong', bg: 'bg-success-soft', border: 'border-success-strong/30' },
}

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000)
  const intervals = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]]
  for (const [label, secs] of intervals) {
    const count = Math.floor(seconds / secs)
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`
  }
  return 'just now'
}

function stripLeadingEmoji(text) {
  return (text || '').replace(/^[^\p{L}\p{N}]+/u, '')
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

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <AdminLayout title="Notifications">
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <p className="text-ink-soft text-sm">New complaints, today's hearings, and cases needing attention</p>
          {unreadCount > 0 && (
            <span className="bg-danger-soft text-danger-strong text-sm font-semibold px-3 py-1 rounded-full">{unreadCount} new</span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <EmptyState
              icon={MdOutlineNotifications}
              title="No notifications yet"
              message="You'll be alerted here when residents file complaints or cases need attention."
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((n) => {
              const t = TYPES[n.type] || TYPES.info
              const Icon = t.icon
              return (
                <div
                  key={n.id}
                  className={`rounded-2xl border p-4 flex gap-3.5 items-start shadow-token-sm ${
                    n.is_read ? 'bg-surface border-border' : `${t.bg} ${t.border}`
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 ${t.color}`}>
                    <Icon className="text-2xl" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2.5 mb-1">
                      <div className="text-base font-bold text-ink">{stripLeadingEmoji(n.title) || 'Notification'}</div>
                      {!n.is_read && <span className="w-2.5 h-2.5 rounded-full bg-danger-strong flex-shrink-0" aria-label="Unread" />}
                    </div>
                    <div className="text-sm text-ink-soft leading-relaxed mb-2">{n.message}</div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-xs text-ink-faint">{timeAgo(n.created_at)}</div>
                      <Link
                        to={n.complaint_id ? `/admin/complaints/${n.complaint_id}` : '/admin/complaints'}
                        className="text-sm font-semibold text-accent flex items-center gap-1"
                      >
                        {n.complaint_id ? 'Open case' : 'View complaints'} <MdArrowForward aria-hidden="true" />
                      </Link>
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
