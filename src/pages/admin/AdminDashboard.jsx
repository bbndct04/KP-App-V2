import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import AdminLayout from '../../components/layout/AdminLayout'

const BADGES = {
  filed: { bg: 'bg-warning-soft', text: 'text-warning-strong', label: 'Filed' },
  summoned: { bg: 'bg-info-soft', text: 'text-info-strong', label: 'Summoned' },
  mediation: { bg: 'bg-accent-soft', text: 'text-accent', label: 'Mediation' },
  pangkat_formed: { bg: 'bg-purple-soft', text: 'text-purple-strong', label: 'Pangkat Formed' },
  pangkat_hearing: { bg: 'bg-purple-soft', text: 'text-purple-strong', label: 'Pangkat Hearing' },
  settled: { bg: 'bg-success-soft', text: 'text-success-strong', label: 'Settled' },
  cfa_issued: { bg: 'bg-neutral-soft', text: 'text-neutral-strong', label: 'CFA Issued' },
  dismissed: { bg: 'bg-danger-soft', text: 'text-danger-strong', label: 'Dismissed' },
}

const IN_PROGRESS_STAGES = ['summoned', 'mediation', 'pangkat_formed', 'pangkat_hearing']
const CLOSED_STAGES = ['settled', 'cfa_issued', 'dismissed']

function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, filed: 0, inProgress: 0, closed: 0, totalUsers: 0, residents: 0 })
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
      const filed = complaints?.filter((c) => c.status === 'filed').length || 0
      const inProgress = complaints?.filter((c) => IN_PROGRESS_STAGES.includes(c.status)).length || 0
      const closed = complaints?.filter((c) => CLOSED_STAGES.includes(c.status)).length || 0
      const totalUsers = profiles?.length || 0
      const residents = profiles?.filter((p) => p.role === 'resident').length || 0

      setStats({ total, filed, inProgress, closed, totalUsers, residents })
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <p className="text-ink-soft text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <div className="flex gap-2.5">
          <Link to="/admin/complaints" className="bg-accent hover:bg-accent-hover text-accent-ink text-sm font-semibold rounded-lg px-5 py-2.5 shadow-token-sm">
            Manage Complaints
          </Link>
          <Link to="/admin/users" className="bg-surface hover:bg-surface-hover text-ink text-sm font-semibold rounded-lg px-5 py-2.5 border border-border">
            Manage Users
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5">
        {[
          { label: 'Total Complaints', val: stats.total, color: 'text-accent' },
          { label: 'Newly Filed', val: stats.filed, color: 'text-warning-strong' },
          { label: 'In Progress', val: stats.inProgress, color: 'text-info-strong' },
          { label: 'Closed', val: stats.closed, color: 'text-success-strong' },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-2xl p-5 shadow-token-md">
            <div className={`text-3xl font-bold mb-1 ${s.color}`}>{s.val}</div>
            <div className="text-ink-soft text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_290px] gap-4 items-start">
        {/* Recent Complaints */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-token-md">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <div className="text-ink text-[15px] font-semibold">Recent Complaints</div>
              <div className="text-ink-faint text-xs mt-0.5">Latest submissions requiring action</div>
            </div>
            <Link to="/admin/complaints" className="text-accent text-sm font-semibold border border-border bg-surface-sunken rounded-lg px-3 py-1.5">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-ink-faint text-sm">Loading...</div>
          ) : recent.length === 0 ? (
            <div className="text-center py-12 text-ink-faint">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-sm">No complaints yet</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-ink-faint text-xs border-b border-border">
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
                    const b = BADGES[c.status] || BADGES.filed
                    return (
                      <tr key={c.id} className="border-b border-border">
                        <td className="px-5 py-3 text-accent font-mono text-sm">{c.reference_number}</td>
                        <td className="px-5 py-3 text-ink text-sm">{c.profiles?.full_name || '—'}</td>
                        <td className="px-5 py-3 text-ink-soft text-sm">{c.category}</td>
                        <td className="px-5 py-3 text-ink-faint text-xs">
                          {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`${b.bg} ${b.text} text-xs font-semibold px-2.5 py-1 rounded-full`}>{b.label}</span>
                        </td>
                        <td className="px-5 py-3">
                          <Link to={`/admin/complaints?search=${c.reference_number}`} className="text-accent text-xs font-semibold border border-border bg-surface-sunken rounded-md px-2.5 py-1.5">
                            Manage
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3.5">
          <div className="bg-surface border border-border rounded-2xl p-4.5 shadow-token-md">
            <div className="text-ink text-sm font-semibold mb-3.5">👥 System Users</div>
            {[
              { label: 'Total Users', val: stats.totalUsers, color: 'text-accent' },
              { label: 'Residents', val: stats.residents, color: 'text-success-strong' },
            ].map((s) => (
              <div key={s.label} className="flex justify-between items-center px-3 py-2 rounded-lg mb-1.5 bg-surface-sunken">
                <span className="text-sm text-ink-soft font-medium">{s.label}</span>
                <span className={`text-lg font-bold ${s.color}`}>{s.val}</span>
              </div>
            ))}
            <Link to="/admin/users" className="block text-center mt-2.5 bg-accent hover:bg-accent-hover text-accent-ink rounded-lg py-2 text-sm font-semibold">
              Manage Users →
            </Link>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4.5 shadow-token-md">
            <div className="text-ink text-sm font-semibold mb-3.5">📊 Top Categories</div>
            {categories.length === 0 ? (
              <div className="text-ink-faint text-xs text-center py-3">No data yet</div>
            ) : (
              categories.map((cat) => {
                const pct = stats.total > 0 ? Math.round((cat.count / stats.total) * 100) : 0
                return (
                  <div key={cat.category} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-ink-soft truncate pr-2">{cat.category}</span>
                      <span className="text-xs font-bold text-accent flex-shrink-0">{cat.count}</span>
                    </div>
                    <div className="h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
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