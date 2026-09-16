import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'

const BADGES = {
  filed: { bg: 'bg-amber-500/15', text: 'text-amber-300', label: 'Filed' },
  summoned: { bg: 'bg-sky-500/15', text: 'text-sky-300', label: 'Summoned' },
  mediation: { bg: 'bg-blue-500/15', text: 'text-blue-300', label: 'Mediation' },
  pangkat_formed: { bg: 'bg-purple-500/15', text: 'text-purple-300', label: 'Pangkat Formed' },
  pangkat_hearing: { bg: 'bg-purple-500/15', text: 'text-purple-300', label: 'Pangkat Hearing' },
  settled: { bg: 'bg-green-500/15', text: 'text-green-300', label: 'Settled' },
  cfa_issued: { bg: 'bg-gray-400/15', text: 'text-gray-300', label: 'CFA Issued' },
  dismissed: { bg: 'bg-red-500/15', text: 'text-red-300', label: 'Dismissed' },
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
        <p className="text-blue-200/60 text-[13.5px]">All your submitted complaints and their current status</p>
        <Link
          to="/complaints/new"
          className="bg-blue-500/80 hover:bg-blue-500 border border-blue-400/30 text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors text-center flex-shrink-0"
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
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
                isActive
                  ? 'bg-blue-500/80 border-blue-400/40 text-white'
                  : 'bg-white/5 border-white/15 text-blue-200/60 hover:bg-white/10'
              }`}
            >
              {f.label} {count > 0 && <span className="opacity-80 font-bold text-xs">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-14 text-blue-200/50 text-sm">Loading...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-blue-200/50 text-xs border-b border-white/10">
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
                    <td colSpan={5} className="text-center py-14 text-blue-200/50">
                      <div className="text-white/80 font-medium mb-1">No reports found</div>
                      <div className="text-sm">
                        {activeFilter !== 'all' ? 'No complaints at this stage yet.' : "You haven't submitted any complaints yet."}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const b = BADGES[c.status] || BADGES.filed
                    return (
                      <tr key={c.id} className="border-b border-white/5">
                        <td className="px-5 py-3.5 text-blue-300 font-mono text-sm whitespace-nowrap">{c.reference_number}</td>
                        <td className="px-5 py-3.5 text-blue-100/80 text-sm">{c.category}</td>
                        <td className="px-5 py-3.5 text-blue-200/50 text-sm hidden sm:table-cell whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`${b.bg} ${b.text} text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap`}>{b.label}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Link
                            to={`/track?ref=${c.reference_number}`}
                            className="text-xs font-semibold text-blue-300 border border-white/15 bg-white/5 rounded-md px-2.5 py-1.5 whitespace-nowrap"
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