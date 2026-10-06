import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import AdminLayout from '../../components/layout/AdminLayout'
import {
  MdOutlineFolderCopy,
  MdOutlineCheckCircle,
  MdOutlineHourglassTop,
  MdOutlineTrendingUp,
  MdOutlineDonutLarge,
  MdOutlineBarChart,
  MdOutlineCalendarMonth,
} from 'react-icons/md'
import { Skeleton } from '../../components/ui'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CAT_COLORS = ['#5ba0f5', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8', '#2dd4bf']

const IN_PROGRESS_STAGES = ['summoned', 'mediation', 'pangkat_formed', 'pangkat_hearing']

function AdminAnalytics() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('complaints').select('status, category, created_at')
      setComplaints(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const total = complaints.length
  const stats = {
    total,
    submitted: complaints.filter((c) => c.status === 'submitted').length,
    declined: complaints.filter((c) => c.status === 'declined').length,
    filed: complaints.filter((c) => c.status === 'filed').length,
    inProgress: complaints.filter((c) => IN_PROGRESS_STAGES.includes(c.status)).length,
    settled: complaints.filter((c) => c.status === 'settled').length,
    cfaIssued: complaints.filter((c) => c.status === 'cfa_issued').length,
    dismissed: complaints.filter((c) => c.status === 'dismissed').length,
  }
  const accepted = total - stats.submitted - stats.declined
  const resRate = accepted > 0 ? Math.round((stats.settled / accepted) * 100) : 0
  const activeCases = stats.filed + stats.inProgress
  const denom = total || 1

  const statusRows = [
    { label: 'Awaiting Review', val: stats.submitted, color: '#fcd34d' },
    { label: 'Filed', val: stats.filed, color: '#fbbf24' },
    { label: 'In Progress', val: stats.inProgress, color: '#38bdf8' },
    { label: 'Settled', val: stats.settled, color: '#34d399' },
    { label: 'CFA Issued', val: stats.cfaIssued, color: '#9ca3af' },
    { label: 'Dismissed', val: stats.dismissed, color: '#f87171' },
    { label: 'Declined', val: stats.declined, color: '#fb923c' },
  ]

  const catCounts = {}
  complaints.forEach((c) => {
    catCounts[c.category] = (catCounts[c.category] || 0) + 1
  })
  const categories = Object.entries(catCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)

  const monthCounts = new Array(12).fill(0)
  const currentYear = new Date().getFullYear()
  complaints.forEach((c) => {
    const d = new Date(c.created_at)
    if (d.getFullYear() === currentYear) monthCounts[d.getMonth()]++
  })
  const maxMonth = Math.max(...monthCounts, 1)

  return (
    <AdminLayout title="Reports & Analytics">
      <p className="text-ink-soft text-sm mb-5">System statistics and complaint insights</p>

      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5">
            {[
              { label: 'Total Complaints', val: stats.total, color: 'text-accent', bg: 'bg-accent-soft', icon: MdOutlineFolderCopy },
              { label: 'Settled', val: stats.settled, color: 'text-success-strong', bg: 'bg-success-soft', icon: MdOutlineCheckCircle },
              { label: 'Active Cases', val: activeCases, color: 'text-warning-strong', bg: 'bg-warning-soft', icon: MdOutlineHourglassTop },
              { label: 'Settlement Rate', val: `${resRate}%`, color: 'text-purple-strong', bg: 'bg-purple-soft', icon: MdOutlineTrendingUp },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="bg-surface border border-border rounded-2xl p-5 shadow-token-md">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
                    <Icon className="text-xl" aria-hidden="true" />
                  </div>
                  <div className={`text-3xl font-bold mb-0.5 ${s.color}`}>{s.val}</div>
                  <div className="text-ink-soft text-sm">{s.label}</div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Status Distribution */}
            <div className="bg-surface border border-border rounded-2xl p-5.5 shadow-token-md">
              <div className="text-ink text-base font-semibold mb-4.5 flex items-center gap-2"><MdOutlineDonutLarge className="text-xl text-accent" aria-hidden="true" /> Status Distribution</div>
              {statusRows.map((s) => {
                const pct = Math.round((s.val / denom) * 100)
                return (
                  <div key={s.label} className="mb-3.5">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-ink-soft font-medium">{s.label}</span>
                      <span className="text-sm font-bold" style={{ color: s.color }}>{s.val} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.color }} />
                    </div>
                  </div>
                )
              })}
              <div className="border-t border-border pt-3.5 mt-4 flex gap-4">
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-success-strong">{resRate}%</div>
                  <div className="text-xs text-ink-faint">Settlement Rate</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-warning-strong">{activeCases}</div>
                  <div className="text-xs text-ink-faint">Active Cases</div>
                </div>
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-surface border border-border rounded-2xl p-5.5 shadow-token-md">
              <div className="text-ink text-base font-semibold mb-4.5 flex items-center gap-2"><MdOutlineBarChart className="text-xl text-accent" aria-hidden="true" /> Top Complaint Categories</div>
              {categories.length === 0 ? (
                <div className="text-ink-faint text-sm text-center py-8">No data yet</div>
              ) : (
                categories.map((cat, i) => {
                  const pct = Math.round((cat.count / denom) * 100)
                  const color = CAT_COLORS[i % CAT_COLORS.length]
                  return (
                    <div key={cat.category} className="mb-3.5">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm text-ink-soft truncate pr-2">{cat.category}</span>
                        <span className="text-xs font-bold flex-shrink-0" style={{ color }}>{cat.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-surface border border-border rounded-2xl p-5.5 shadow-token-md">
            <div className="text-ink text-base font-semibold mb-5 flex items-center gap-2"><MdOutlineCalendarMonth className="text-xl text-accent" aria-hidden="true" /> Monthly Trend — {currentYear}</div>
            <div className="flex items-end justify-between gap-2 h-[180px] overflow-x-auto">
              {monthCounts.map((count, i) => {
                const heightPct = (count / maxMonth) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 min-w-[20px]">
                    <div className="text-xs text-ink-soft font-semibold">{count > 0 ? count : ''}</div>
                    <div
                      className="w-full rounded-t-md bg-accent/70 hover:bg-accent transition-colors min-h-[2px]"
                      style={{ height: `${heightPct}%` }}
                    />
                    <div className="text-xs text-ink-faint">{MONTHS[i]}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}

export default AdminAnalytics