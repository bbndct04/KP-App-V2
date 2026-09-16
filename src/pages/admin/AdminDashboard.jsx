import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import AdminLayout from '../../components/layout/AdminLayout'

const BADGES = {
  pending: { bg: 'bg-amber-500/15', text: 'text-amber-300', label: 'Pending' },
  under_review: { bg: 'bg-sky-500/15', text: 'text-sky-300', label: 'For Review' },
  resolved: { bg: 'bg-green-500/15', text: 'text-green-300', label: 'Resolved' },
  rejected: { bg: 'bg-red-500/15', text: 'text-red-300', label: 'Rejected' },
}

function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, under_review: 0, resolved: 0, totalUsers: 0, residents: 0 })
  const [recent, setRecent] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: complaints } = await supabase
        .from('complaints')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })

      const { data: profiles } = await supabase.from('profiles').select('role')

      const total = complaints?.length || 0
      const pending = complaints?.filter((c) => c.status === 'pending').length || 0
      const under_review = complaints?.filter((c) => c.status === 'under_review').length || 0
      const resolved = complaints?.filter((c) => c.status === 'resolved').length || 0
      const totalUsers = profiles?.length || 0
      const residents = profiles?.filter((p) => p.role === 'resident').length || 0

      setStats({ total, pending, under_review, resolved, totalUsers, residents })
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

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="flex items-center justify-between mb-5">
        <p className="text-blue-200/60 text-[13.5px]">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <div className="flex gap-2.5">
          <Link to="/admin/complaints" className="bg-blue-500/90 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg px-5 py-2.5 border border-blue-400/30">
            Manage Complaints
          </Link>
          <Link to="/admin/users" className="bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-lg px-5 py-2.5 border border-white/20">
            Manage Users
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        {[
          { label: 'Total Complaints', val: stats.total, color: 'text-blue-300' },
          { label: 'Pending', val: stats.pending, color: 'text-amber-300' },
          { label: 'For Review', val: stats.under_review, color: 'text-sky-300' },
          { label: 'Resolved', val: stats.resolved, color: 'text-green-300' },
        ].map((s) => (
          <div key={s.label} className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5">
            <div className={`text-3xl font-bold mb-1 ${s.color}`}>{s.val}</div>
            <div className="text-blue-200/60 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_290px] gap-4 items-start">
        {/* Recent Complaints */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <div className="text-white text-[15px] font-semibold">Recent Complaints</div>
              <div className="text-blue-200/50 text-xs mt-0.5">Latest submissions requiring action</div>
            </div>
            <Link to="/admin/complaints" className="text-blue-300 text-sm font-semibold border border-white/20 bg-white/5 rounded-lg px-3 py-1.5">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-blue-200/50 text-sm">Loading...</div>
          ) : recent.length === 0 ? (
            <div className="text-center py-12 text-blue-200/50">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-sm">No complaints yet</div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-blue-200/50 text-xs border-b border-white/10">
                  <th className="px-5 py-2.5">Ref. No.</th>
                  <th className="px-5 py-2.5">Resident</th>
                  <th className="px-5 py-2.5">Category</th>
                  <th className="px-5 py-2.5">Filed</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => {
                  const b = BADGES[c.status] || BADGES.pending
                  return (
                    <tr key={c.id} className="border-b border-white/5">
                      <td className="px-5 py-3 text-blue-300 font-mono text-sm">{c.reference_number}</td>
                      <td className="px-5 py-3 text-white text-sm">{c.profiles?.full_name || '—'}</td>
                      <td className="px-5 py-3 text-blue-100/80 text-sm">{c.category}</td>
                      <td className="px-5 py-3 text-blue-200/50 text-xs">
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`${b.bg} ${b.text} text-xs font-semibold px-2.5 py-1 rounded-full`}>{b.label}</span>
                      </td>
                      <td className="px-5 py-3">
                        <Link to={`/admin/complaints?search=${c.reference_number}`} className="text-blue-300 text-xs font-semibold border border-white/15 bg-white/5 rounded-md px-2.5 py-1.5">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3.5">
          <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4.5">
            <div className="text-white text-sm font-semibold mb-3.5">👥 System Users</div>
            {[
              { label: 'Total Users', val: stats.totalUsers, color: 'text-blue-300' },
              { label: 'Residents', val: stats.residents, color: 'text-green-300' },
            ].map((s) => (
              <div key={s.label} className="flex justify-between items-center px-3 py-2 rounded-lg mb-1.5 bg-white/5">
                <span className="text-[13px] text-blue-100/70 font-medium">{s.label}</span>
                <span className={`text-lg font-bold ${s.color}`}>{s.val}</span>
              </div>
            ))}
            <Link to="/admin/users" className="block text-center mt-2.5 bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg py-2 text-sm font-semibold">
              Manage Users →
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4.5">
            <div className="text-white text-sm font-semibold mb-3.5">📊 Top Categories</div>
            {categories.length === 0 ? (
              <div className="text-blue-200/40 text-xs text-center py-3">No data yet</div>
            ) : (
              categories.map((cat) => {
                const pct = stats.total > 0 ? Math.round((cat.count / stats.total) * 100) : 0
                return (
                  <div key={cat.category} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-[12px] text-blue-100/70 truncate pr-2">{cat.category}</span>
                      <span className="text-xs font-bold text-blue-300 flex-shrink-0">{cat.count}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard