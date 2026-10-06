import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'

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

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'filed', label: 'Filed' },
  { key: 'summoned', label: 'Summoned' },
  { key: 'mediation', label: 'Mediation' },
  { key: 'pangkat_formed', label: 'Pangkat Formed' },
  { key: 'pangkat_hearing', label: 'Pangkat Hearing' },
  { key: 'settled', label: 'Settled' },
  { key: 'cfa_issued', label: 'CFA Issued' },
  { key: 'dismissed', label: 'Dismissed' },
]

function MyReports() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    async function loadComplaints() {
      if (!user) return
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setComplaints(data || [])
      setLoading(false)
    }
    loadComplaints()
  }, [user])

  function countFor(key) {
    if (key === 'all') return complaints.length
    return complaints.filter((c) => c.status === key).length
  }

  const filtered = activeFilter === 'all' ? complaints : complaints.filter((c) => c.status === activeFilter)

  return (
    <AppLayout title="My Reports">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <p className="text-ink-soft text-sm">All your submitted complaints and their current status</p>
        <Link
          to="/complaints/new"
          className="bg-accent hover:bg-accent-hover text-accent-ink text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors text-center flex-shrink-0 shadow-token-sm"
        >
          + New Report
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 flex-wrap mb-4.5">
        {FILTERS.map((f) => {
          const count = countFor(f.key)
          const isActive = activeFilter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                isActive
                  ? 'bg-accent border-accent text-accent-ink'
                  : 'bg-surface-sunken border-border text-ink-soft hover:bg-surface-hover'
              }`}
            >
              {f.label} {count > 0 && <span className="opacity-80 font-bold text-xs">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-token-md">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-14 text-ink-faint text-sm">Loading...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-ink-faint text-xs border-b border-border">
                  <th className="px-5 py-3">Reference No.</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Filed</th>
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-14 text-ink-faint">
                      <div className="text-ink font-medium mb-1">No reports found</div>
                      <div className="text-sm">
                        {activeFilter !== 'all' ? 'No complaints at this stage yet.' : "You haven't submitted any complaints yet."}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const b = BADGES[c.status] || BADGES.filed
                    return (
                      <tr key={c.id} className="border-b border-border">
                        <td className="px-5 py-3.5 text-accent font-mono text-sm whitespace-nowrap">{c.reference_number}</td>
                        <td className="px-5 py-3.5 text-ink-soft text-sm">{c.category}</td>
                        <td className="px-5 py-3.5 text-ink-faint text-sm hidden sm:table-cell whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`${b.bg} ${b.text} text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap`}>{b.label}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Link
                            to={`/track?ref=${c.reference_number}`}
                            className="text-xs font-semibold text-accent border border-border bg-surface-sunken rounded-md px-2.5 py-1.5 whitespace-nowrap"
                          >
                            Track
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default MyReports