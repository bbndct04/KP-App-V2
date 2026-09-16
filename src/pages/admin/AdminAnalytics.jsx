import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import AdminLayout from '../../components/layout/AdminLayout'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CAT_COLORS = ['#5ba0f5', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8', '#2dd4bf']

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
    pending: complaints.filter((c) => c.status === 'pending').length,
    under_review: complaints.filter((c) => c.status === 'under_review').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
    rejected: complaints.filter((c) => c.status === 'rejected').length,
  }
  const resRate = total > 0 ? Math.round((stats.resolved / total) * 100) : 0
  const activeCases = stats.pending + stats.under_review
  const denom = total || 1

  const statusRows = [
    { label: 'Pending', val: stats.pending, color: '#fbbf24' },
    { label: 'For Review', val: stats.under_review, color: '#38bdf8' },
    { label: 'Resolved', val: stats.resolved, color: '#34d399' },
    { label: 'Rejected', val: stats.rejected, color: '#f87171' },
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
      <p className="text-blue-200/60 text-[13.5px] mb-5">System statistics and complaint insights</p>

      {loading ? (
        <div className="text-center py-14 text-blue-200/50 text-sm">Loading...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3.5 mb-5">
            {[
              { label: 'Total Complaints', val: stats.total, color: 'text-blue-300' },
              { label: 'Resolved', val: stats.resolved, color: 'text-green-300' },
              { label: 'Pending', val: stats.pending, color: 'text-amber-300' },
              { label: 'Resolution Rate', val: `${resRate}%`, color: 'text-purple-300' },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5">
                <div className={`text-3xl font-bold mb-1 ${s.color}`}>{s.val}</div>
                <div className="text-blue-200/60 text-sm">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Status Distribution */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5.5">
              <div className="text-white text-[15px] font-semibold mb-4.5">Status Distribution</div>
              {statusRows.map((s) => {
                const pct = Math.round((s.val / denom) * 100)
                return (
                  <div key={s.label} className="mb-3.5">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[13px] text-blue-100/70 font-medium">{s.label}</span>
                      <span className="text-[13px] font-bold" style={{ color: s.color }}>{s.val} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.color }} />
                    </div>
                  </div>
                )
              })}
              <div className="border-t border-white/10 pt-3.5 mt-4 flex gap-4">
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-green-300">{resRate}%</div>
                  <div className="text-xs text-blue-200/40">Resolution Rate</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-amber-300">{activeCases}</div>
                  <div className="text-xs text-blue-200/40">Active Cases</div>
                </div>
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5.5">
              <div className="text-white text-[15px] font-semibold mb-4.5">Top Complaint Categories</div>
              {categories.length === 0 ? (
                <div className="text-blue-200/40 text-sm text-center py-8">No data yet</div>
              ) : (
                categories.map((cat, i) => {
                  const pct = Math.round((cat.count / denom) * 100)
                  const color = CAT_COLORS[i % CAT_COLORS.length]
                  return (
                    <div key={cat.category} className="mb-3.5">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[12.5px] text-blue-100/70 truncate pr-2">{cat.category}</span>
                        <span className="text-[12px] font-bold flex-shrink-0" style={{ color }}>{cat.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5.5">
            <div className="text-white text-[15px] font-semibold mb-5">Monthly Trend — {currentYear}</div>
            <div className="flex items-end justify-between gap-2 h-[180px]">
              {monthCounts.map((count, i) => {
                const heightPct = (count / maxMonth) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                    <div className="text-[11px] text-blue-200/60 font-semibold">{count > 0 ? count : ''}</div>
                    <div
                      className="w-full rounded-t-md bg-blue-400/70 hover:bg-blue-400 transition-colors min-h-[2px]"
                      style={{ height: `${heightPct}%` }}
                    />
                    <div className="text-[11px] text-blue-200/40">{MONTHS[i]}</div>
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