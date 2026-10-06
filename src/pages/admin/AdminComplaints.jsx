import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
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
      <p className="text-ink-soft text-sm mb-4">Track and manage all barangay cases</p>

      {/* Search + Filter */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-5 flex gap-2.5 flex-wrap items-center shadow-token-md">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ref, resident, or category..."
          className="flex-1 min-w-[220px] bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface-sunken border border-border text-ink rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="all">All Stages</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
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
                    <td colSpan={6} className="text-center py-14 text-ink-faint">No complaints found</td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const b = BADGES[c.status] || BADGES.filed
                    return (
                      <tr key={c.id} className="border-b border-border">
                        <td className="px-5 py-3.5 text-accent font-mono text-sm">{c.reference_number}</td>
                        <td className="px-5 py-3.5 text-ink text-sm">{c.profiles?.full_name || '—'}</td>
                        <td className="px-5 py-3.5 text-ink-soft text-sm">{c.category}</td>
                        <td className="px-5 py-3.5 text-ink-faint text-xs">
                          {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`${b.bg} ${b.text} text-xs font-semibold px-2.5 py-1 rounded-full`}>{b.label}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Link
                            to={`/admin/complaints/${c.id}`}
                            className="text-xs font-semibold text-accent border border-border bg-surface-sunken rounded-md px-3 py-1.5"
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