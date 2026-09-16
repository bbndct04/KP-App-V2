import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import AdminLayout from '../../components/layout/AdminLayout'

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

const STATUS_OPTIONS = [
  { value: 'filed', label: 'Filed' },
  { value: 'summoned', label: 'Summoned' },
  { value: 'mediation', label: 'Mediation' },
  { value: 'pangkat_formed', label: 'Pangkat Formed' },
  { value: 'pangkat_hearing', label: 'Pangkat Hearing' },
  { value: 'settled', label: 'Settled' },
  { value: 'cfa_issued', label: 'CFA Issued' },
  { value: 'dismissed', label: 'Dismissed' },
]

function AdminComplaints() {
  const [searchParams] = useSearchParams()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState('all')

  async function loadComplaints() {
    setLoading(true)
    const { data } = await supabase
      .from('complaints')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
    setComplaints(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadComplaints()
  }, [])

  const filtered = complaints.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    const s = search.toLowerCase()
    const matchesSearch =
      !s ||
      c.reference_number?.toLowerCase().includes(s) ||
      c.category?.toLowerCase().includes(s) ||
      c.profiles?.full_name?.toLowerCase().includes(s)
    return matchesStatus && matchesSearch
  })

  return (
    <AdminLayout title="All Complaints">
      <p className="text-blue-200/60 text-[13.5px] mb-4">Track and manage all barangay cases</p>

      {/* Search + Filter */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4 mb-5 flex gap-2.5 flex-wrap items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ref, resident, or category..."
          className="flex-1 min-w-[220px] bg-white/10 border border-white/20 text-white placeholder-blue-200/30 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/10 border border-white/20 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 [color-scheme:dark]"
        >
          <option value="all">All Stages</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
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
                  <th className="px-5 py-3">Ref. No.</th>
                  <th className="px-5 py-3">Resident</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Filed</th>
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-14 text-blue-200/50">No complaints found</td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const b = BADGES[c.status] || BADGES.filed
                    return (
                      <tr key={c.id} className="border-b border-white/5">
                        <td className="px-5 py-3.5 text-blue-300 font-mono text-sm">{c.reference_number}</td>
                        <td className="px-5 py-3.5 text-white text-sm">{c.profiles?.full_name || '—'}</td>
                        <td className="px-5 py-3.5 text-blue-100/80 text-sm">{c.category}</td>
                        <td className="px-5 py-3.5 text-blue-200/50 text-xs">
                          {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`${b.bg} ${b.text} text-xs font-semibold px-2.5 py-1 rounded-full`}>{b.label}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Link
                            to={`/admin/complaints/${c.id}`}
                            className="text-xs font-semibold text-blue-300 border border-white/15 bg-white/5 rounded-md px-3 py-1.5"
                          >
                            Manage case →
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
    </AdminLayout>
  )
}

export default AdminComplaints