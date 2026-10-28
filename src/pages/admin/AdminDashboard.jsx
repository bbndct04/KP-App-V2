import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import AdminLayout from '../../components/layout/AdminLayout'
import {
  MdOutlineFolderCopy,
  MdOutlineInbox,
  MdOutlineMoveToInbox,
  MdOutlineHourglassTop,
  MdOutlineCheckCircle,
  MdOutlineAssignment,
  MdOutlineManageAccounts,
  MdOutlineGroups,
  MdOutlineBarChart,
  MdOutlineHistory,
  MdOutlineEvent,
  MdOutlineEventAvailable,
  MdOutlinePriorityHigh,
  MdOutlineTaskAlt,
  MdArrowForward,
} from 'react-icons/md'
import { DeadlineBadge } from '../../components/cases'
import { caseDeadline, loadStageDates, daysFromToday, formatTime, relativeDay, upcomingHearings } from '../../lib/cases'

const URGENCY = { danger: 0, warning: 1 }
import { Card, CardHeader, StatusBadge, EmptyState, SkeletonRows, LinkButton } from '../../components/ui'
import { ACTIVE_STAGES, CLOSED_STAGES } from '../../components/status'
import ComplaintCards from '../../components/ComplaintCards'

function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, awaiting: 0, inProgress: 0, closed: 0, totalUsers: 0, residents: 0 })
  const [recent, setRecent] = useState([])
  const [categories, setCategories] = useState([])
  const [hearings, setHearings] = useState({ today: [], next: null })
  const [attention, setAttention] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: complaints } = await supabase
        .from('complaints')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })

      const { data: profiles } = await supabase.from('profiles').select('role')

      const total = complaints?.length || 0
      const awaiting = complaints?.filter((c) => c.status === 'submitted').length || 0
      const inProgress = complaints?.filter((c) => ACTIVE_STAGES.includes(c.status)).length || 0
      const closed = complaints?.filter((c) => [...CLOSED_STAGES, 'declined'].includes(c.status)).length || 0
      const totalUsers = profiles?.length || 0
      const residents = profiles?.filter((p) => p.role === 'resident').length || 0

      setStats({ total, awaiting, inProgress, closed, totalUsers, residents })

      const upcoming = upcomingHearings(complaints || [])
      setHearings({
        today: upcoming.filter((c) => daysFromToday(c.hearing_date) === 0),
        next: upcoming.find((c) => daysFromToday(c.hearing_date) > 0) || null,
      })

      const open = (complaints || []).filter((c) => c.status === 'submitted' || ACTIVE_STAGES.includes(c.status))
      const dates = await loadStageDates(open.filter((c) => c.status !== 'submitted').map((c) => c.id))
      setAttention(
        open
          .map((c) => ({ ...c, deadline: caseDeadline(c, dates[c.id]) }))
          .filter((c) => c.deadline && c.deadline.tone in URGENCY)
          .sort((a, b) => URGENCY[a.deadline.tone] - URGENCY[b.deadline.tone])
      )
      setRecent((complaints || []).slice(0, 8))

      const catCounts = {}
      ;(complaints || []).forEach((c) => {
        catCounts[c.category] = (catCounts[c.category] || 0) + 1
      })
      const catArr = Object.entries(catCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
      setCategories(catArr)

      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: 'Total Complaints', val: stats.total, icon: MdOutlineFolderCopy, color: 'text-accent', bg: 'bg-accent-soft' },
    { label: 'Awaiting Review', val: stats.awaiting, icon: MdOutlineMoveToInbox, color: 'text-warning-strong', bg: 'bg-warning-soft' },
    { label: 'In Progress', val: stats.inProgress, icon: MdOutlineHourglassTop, color: 'text-info-strong', bg: 'bg-info-soft' },
    { label: 'Closed', val: stats.closed, icon: MdOutlineCheckCircle, color: 'text-success-strong', bg: 'bg-success-soft' },
  ]

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <p className="text-ink-soft text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <div className="flex gap-2.5 flex-wrap">
          <LinkButton to="/admin/complaints" icon={MdOutlineMoveToInbox}>
            New Complaints
          </LinkButton>
          <LinkButton to="/admin/cases" variant="secondary" icon={MdOutlineAssignment}>
            Active Cases
          </LinkButton>
        </div>
      </div>

      {!loading && stats.awaiting > 0 && (
        <Link
          to="/admin/complaints"
          className="mb-5 flex items-center gap-3 bg-warning-soft border border-warning-strong/30 rounded-2xl px-5 py-4 text-warning-strong hover:opacity-90 transition-opacity"
        >
          <MdOutlineMoveToInbox className="text-3xl flex-shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <div className="text-base font-bold">
              {stats.awaiting} complaint{stats.awaiting === 1 ? ' is' : 's are'} waiting for your review
            </div>
            <div className="text-sm">Residents are waiting to hear back. Review them as soon as you can.</div>
          </div>
          <span className="text-sm font-semibold flex items-center gap-1 flex-shrink-0">
            Review now <MdArrowForward aria-hidden="true" />
          </span>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5 items-start stagger">
        <Card className="overflow-hidden">
          <CardHeader
            icon={MdOutlineEvent}
            title="Today's hearings"
            subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          />
          {loading ? (
            <SkeletonRows rows={2} />
          ) : hearings.today.length === 0 ? (
            <div className="px-5 py-6 flex items-center gap-3">
              <MdOutlineEventAvailable className="text-3xl text-ink-faint flex-shrink-0" aria-hidden="true" />
              <div className="text-sm">
                <div className="text-ink font-semibold">No hearings today</div>
                {hearings.next ? (
                  <Link to={`/admin/cases/${hearings.next.id}`} className="text-accent font-semibold">
                    Next: {relativeDay(hearings.next.hearing_date)}
                    {hearings.next.hearing_time && `, ${formatTime(hearings.next.hearing_time)}`} · {hearings.next.reference_number}
                  </Link>
                ) : (
                  <div className="text-ink-faint">No upcoming hearings scheduled.</div>
                )}
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {hearings.today.map((c) => (
                <li key={c.id}>
                  <Link to={`/admin/cases/${c.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-hover transition-colors">
                    <div className="w-[72px] flex-shrink-0 text-accent font-bold text-base">{c.hearing_time ? formatTime(c.hearing_time) : 'TBA'}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-ink text-sm font-semibold truncate">
                        {c.complainant_name || c.profiles?.full_name || '—'} vs. {c.respondent_name || '—'}
                      </div>
                      <div className="text-ink-faint text-xs truncate">
                        <span className="font-mono">{c.reference_number}</span> · {c.category}
                      </div>
                    </div>
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader icon={MdOutlinePriorityHigh} title="Needs attention" subtitle="Cases near or past their KP deadlines" />
          {loading ? (
            <SkeletonRows rows={2} />
          ) : attention.length === 0 ? (
            <div className="px-5 py-6 flex items-center gap-3">
              <MdOutlineTaskAlt className="text-3xl text-success-strong flex-shrink-0" aria-hidden="true" />
              <div className="text-sm">
                <div className="text-ink font-semibold">All cases are on schedule</div>
                <div className="text-ink-faint">Nothing is close to a deadline.</div>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border max-h-[300px] overflow-y-auto">
              {attention.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/admin/${c.status === 'submitted' ? 'complaints' : 'cases'}/${c.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-surface-hover transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-ink text-sm font-semibold truncate">{c.category}</div>
                      <div className="text-ink-faint text-xs font-mono">{c.reference_number}</div>
                    </div>
                    <DeadlineBadge deadline={c.deadline} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5 stagger">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="p-5 lift">
              <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
                <Icon className="text-xl" aria-hidden="true" />
              </div>
              <div className={`text-3xl font-bold mb-0.5 ${s.color}`}>{loading ? '–' : s.val}</div>
              <div className="text-ink-soft text-sm">{s.label}</div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
        <Card className="overflow-hidden">
          <CardHeader
            icon={MdOutlineHistory}
            title="Recent Complaints"
            subtitle="Latest submissions requiring action"
            action={
              <Link to="/admin/complaints" className="text-accent text-sm font-semibold flex items-center gap-1 flex-shrink-0">
                View all <MdArrowForward aria-hidden="true" />
              </Link>
            }
          />

          {loading ? (
            <SkeletonRows rows={5} />
          ) : recent.length === 0 ? (
            <EmptyState icon={MdOutlineInbox} title="No complaints yet" message="New complaints from residents will appear here." />
          ) : (
            <>
              <ComplaintCards complaints={recent} linkFor={(c) => `/admin/complaints/${c.id}`} linkLabel="Manage" showResident />
              <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-ink-faint text-xs uppercase tracking-wide border-b border-border">
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">Ref. No.</th>
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">Resident</th>
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">Category</th>
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">Filed</th>
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">Status</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="stagger">
                  {recent.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3.5 text-accent font-mono text-sm whitespace-nowrap">{c.reference_number}</td>
                      <td className="px-5 py-3.5 text-ink text-sm whitespace-nowrap max-w-[180px] truncate">{c.profiles?.full_name || '—'}</td>
                      <td className="px-5 py-3.5 text-ink-soft text-sm max-w-[200px] truncate">{c.category}</td>
                      <td className="px-5 py-3.5 text-ink-faint text-sm whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <Link to={`/admin/complaints/${c.id}`} className="text-accent text-sm font-semibold whitespace-nowrap flex items-center gap-1">
                          Manage <MdArrowForward aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <MdOutlineGroups className="text-xl text-accent" aria-hidden="true" />
              <div className="text-ink text-base font-semibold">System Users</div>
            </div>
            {[
              { label: 'Total Users', val: stats.totalUsers, color: 'text-accent' },
              { label: 'Residents', val: stats.residents, color: 'text-success-strong' },
            ].map((s) => (
              <div key={s.label} className="flex justify-between items-center px-3.5 py-2.5 rounded-lg mb-2 bg-surface-sunken">
                <span className="text-sm text-ink-soft font-medium">{s.label}</span>
                <span className={`text-lg font-bold ${s.color}`}>{loading ? '–' : s.val}</span>
              </div>
            ))}
            <LinkButton to="/admin/users" icon={MdOutlineManageAccounts} className="w-full mt-2">
              Manage Users
            </LinkButton>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <MdOutlineBarChart className="text-xl text-accent" aria-hidden="true" />
              <div className="text-ink text-base font-semibold">Top Categories</div>
            </div>
            {categories.length === 0 ? (
              <div className="text-ink-faint text-sm text-center py-3">No data yet</div>
            ) : (
              categories.map((cat) => {
                const pct = stats.total > 0 ? Math.round((cat.count / stats.total) * 100) : 0
                return (
                  <div key={cat.category} className="mb-3.5 last:mb-0">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-ink-soft truncate pr-2">{cat.category}</span>
                      <span className="text-sm font-bold text-accent flex-shrink-0">{cat.count}</span>
                    </div>
                    <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
