import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MdSearch, MdOutlineAssignment, MdOutlineSearchOff, MdArrowForward } from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import AdminLayout from '../../components/layout/AdminLayout'
import { Card, Input, Select, StatusBadge, EmptyState, SkeletonRows } from '../../components/ui'
import ComplaintCards from '../../components/ComplaintCards'
import { STATUS, ACTIVE_STAGES, CLOSED_STAGES } from '../../components/status'

const ACCEPTED = [...ACTIVE_STAGES, ...CLOSED_STAGES]

function AdminCases() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('all')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('complaints')
        .select('*, profiles(full_name)')
        .in('status', ACCEPTED)
        .order('created_at', { ascending: false })
      setCases(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const stages = tab === 'active' ? ACTIVE_STAGES : CLOSED_STAGES
  const inTab = cases.filter((c) => stages.includes(c.status))
  const activeCount = cases.filter((c) => ACTIVE_STAGES.includes(c.status)).length
  const closedCount = cases.filter((c) => CLOSED_STAGES.includes(c.status)).length

  const s = search.trim().toLowerCase()
  const list = inTab.filter((c) => {
    const matchesStage = stage === 'all' || c.status === stage
    const matchesSearch =
      !s ||
      c.reference_number?.toLowerCase().includes(s) ||
      c.category?.toLowerCase().includes(s) ||
      c.profiles?.full_name?.toLowerCase().includes(s) ||
      c.respondent_name?.toLowerCase().includes(s)
    return matchesStage && matchesSearch
  })

  function switchTab(key) {
    setTab(key)
    setStage('all')
  }

  const tabBtn = (key, label, count) => (
    <button
      key={key}
      onClick={() => switchTab(key)}
      aria-pressed={tab === key}
      className={`h-10 px-4 rounded-full text-sm font-semibold border transition-colors ${
        tab === key ? 'bg-accent border-accent text-accent-ink' : 'bg-surface border-border text-ink-soft hover:bg-surface-hover'
      }`}
    >
      {label} <span className="ml-1 opacity-80">{count}</span>
    </button>
  )

  return (
    <AdminLayout title="Active Cases">
      <p className="text-ink-soft text-sm mb-4">Complaints you accepted and are handling</p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabBtn('active', 'Active', activeCount)}
        {tabBtn('closed', 'Closed', closedCount)}
      </div>

      <Card className="p-4 mb-5 flex gap-2.5 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px]">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-ink-faint pointer-events-none" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ref. no."
            aria-label="Search cases"
            className="pl-10"
          />
        </div>
        <Select value={stage} onChange={(e) => setStage(e.target.value)} aria-label="Filter by stage" className="w-auto min-w-[180px]">
          <option value="all">All stages</option>
          {stages.map((key) => (
            <option key={key} value={key}>
              {STATUS[key].label}
            </option>
          ))}
        </Select>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <SkeletonRows rows={6} />
        ) : list.length === 0 ? (
          s || stage !== 'all' ? (
            <EmptyState icon={MdOutlineSearchOff} title="No matching cases" message="Try a different search or stage." />
          ) : (
            <EmptyState
              icon={MdOutlineAssignment}
              title={tab === 'active' ? 'No active cases' : 'No closed cases yet'}
              message={tab === 'active' ? 'Complaints you accept from New Complaints will appear here.' : 'Settled, dismissed, and CFA cases will appear here.'}
            />
          )
        ) : (
          <>
            <ComplaintCards complaints={list} linkFor={(c) => `/admin/cases/${c.id}`} linkLabel="Manage" showResident />
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
                  {list.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="px-5 py-3.5 text-accent font-mono text-sm whitespace-nowrap">{c.reference_number}</td>
                      <td className="px-5 py-3.5 text-ink text-sm">{c.profiles?.full_name || '—'}</td>
                      <td className="px-5 py-3.5 text-ink-soft text-sm">{c.category}</td>
                      <td className="px-5 py-3.5 text-ink-faint text-sm whitespace-nowrap">
                        {new Date(c.reviewed_at || c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <Link to={`/admin/cases/${c.id}`} className="text-accent text-sm font-semibold whitespace-nowrap flex items-center gap-1">
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
      {!loading && list.length > 0 && (
        <div className="text-ink-faint text-sm mt-3">
          Showing {list.length} of {inTab.length} {tab} case{inTab.length === 1 ? '' : 's'}
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminCases
