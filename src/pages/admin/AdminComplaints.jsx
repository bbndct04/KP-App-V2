import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { MdSearch, MdOutlineInbox, MdOutlineSearchOff, MdArrowForward } from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import AdminLayout from '../../components/layout/AdminLayout'
import { Card, Input, Select, StatusBadge, EmptyState, SkeletonRows } from '../../components/ui'
import ComplaintCards from '../../components/ComplaintCards'
import { STATUS } from '../../components/status'

function AdminComplaints() {
  const [searchParams] = useSearchParams()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function loadComplaints() {
      const { data } = await supabase
        .from('complaints')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
      setComplaints(data || [])
      setLoading(false)
    }
    loadComplaints()
  }, [])

  const filtered = complaints.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    const s = search.trim().toLowerCase()
    const matchesSearch =
      !s ||
      c.reference_number?.toLowerCase().includes(s) ||
      c.category?.toLowerCase().includes(s) ||
      c.profiles?.full_name?.toLowerCase().includes(s) ||
      c.respondent_name?.toLowerCase().includes(s)
    return matchesStatus && matchesSearch
  })

  const isFiltering = search.trim() || statusFilter !== 'all'

  return (
    <AdminLayout title="All Complaints">
      <p className="text-ink-soft text-sm mb-4">Track and manage all barangay cases</p>

      <Card className="p-4 mb-5 flex gap-2.5 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px]">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-ink-faint pointer-events-none" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ref. no."
            aria-label="Search complaints"
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by stage"
          className="w-auto min-w-[180px]"
        >
          <option value="all">All Stages</option>
          {Object.entries(STATUS).map(([value, s]) => (
            <option key={value} value={value}>
              {s.label}
            </option>
          ))}
        </Select>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <SkeletonRows rows={6} />
        ) : filtered.length === 0 ? (
          isFiltering ? (
            <EmptyState icon={MdOutlineSearchOff} title="No matching complaints" message="Try a different search term or stage filter." />
          ) : (
            <EmptyState icon={MdOutlineInbox} title="No complaints yet" message="Complaints filed by residents will appear here." />
          )
        ) : (
          <>
            <ComplaintCards complaints={filtered} linkFor={(c) => `/admin/complaints/${c.id}`} linkLabel="Manage" showResident />
            <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-ink-faint text-xs uppercase tracking-wide border-b border-border">
                  <th className="px-5 py-3 font-semibold whitespace-nowrap">Ref. No.</th>
                  <th className="px-5 py-3 font-semibold whitespace-nowrap">Resident</th>
                  <th className="px-5 py-3 font-semibold whitespace-nowrap">Category</th>
                  <th className="px-5 py-3 font-semibold whitespace-nowrap">Filed</th>
                  <th className="px-5 py-3 font-semibold whitespace-nowrap">Stage</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-3.5 text-accent font-mono text-sm whitespace-nowrap">{c.reference_number}</td>
                    <td className="px-5 py-3.5 text-ink text-sm">{c.profiles?.full_name || '—'}</td>
                    <td className="px-5 py-3.5 text-ink-soft text-sm">{c.category}</td>
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
      {!loading && filtered.length > 0 && (
        <div className="text-ink-faint text-sm mt-3">
          Showing {filtered.length} of {complaints.length} complaint{complaints.length === 1 ? '' : 's'}
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminComplaints
