import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MdSearch, MdOutlineTaskAlt, MdOutlineSearchOff, MdOutlineBlock, MdArrowForward } from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import AdminLayout from '../../components/layout/AdminLayout'
import { Card, Input, EmptyState, SkeletonRows } from '../../components/ui'
import { INTAKE_STATUSES } from '../../components/status'

function waitInfo(createdAt, now) {
  const days = Math.floor((now - new Date(createdAt).getTime()) / 86400000)
  if (days < 1) return { label: 'Today', cls: 'bg-surface-sunken text-ink-soft' }
  if (days === 1) return { label: '1 day', cls: 'bg-warning-soft text-warning-strong' }
  return { label: `${days} days`, cls: 'bg-danger-soft text-danger-strong' }
}

function shortDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

function AdminComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('submitted')
  const [search, setSearch] = useState('')
  const [now] = useState(() => Date.now())

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('complaints')
        .select('*, profiles(full_name)')
        .in('status', INTAKE_STATUSES)
        .order('created_at', { ascending: true })
      setComplaints(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const awaiting = complaints.filter((c) => c.status === 'submitted')
  const declined = complaints
    .filter((c) => c.status === 'declined')
    .sort((a, b) => new Date(b.reviewed_at || b.created_at) - new Date(a.reviewed_at || a.created_at))

  const s = search.trim().toLowerCase()
  const list = (tab === 'submitted' ? awaiting : declined).filter(
    (c) =>
      !s ||
      c.reference_number?.toLowerCase().includes(s) ||
      c.category?.toLowerCase().includes(s) ||
      c.profiles?.full_name?.toLowerCase().includes(s) ||
      c.respondent_name?.toLowerCase().includes(s)
  )

  const tabBtn = (key, label, count) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      aria-pressed={tab === key}
      className={`h-10 px-4 rounded-full text-sm font-semibold border transition-colors ${
        tab === key ? 'bg-accent border-accent text-accent-ink' : 'bg-surface border-border text-ink-soft hover:bg-surface-hover'
      }`}
    >
      {label} <span className="ml-1 opacity-80">{count}</span>
    </button>
  )

  return (
    <AdminLayout title="New Complaints">
      <p className="text-ink-soft text-sm mb-4">Review complaints submitted by residents</p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabBtn('submitted', 'Awaiting review', awaiting.length)}
        {tabBtn('declined', 'Declined', declined.length)}
      </div>

      <Card className="p-4 mb-5">
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-ink-faint pointer-events-none" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ref. no."
            aria-label="Search complaints"
            className="pl-10"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <SkeletonRows rows={5} />
        ) : list.length === 0 ? (
          s ? (
            <EmptyState icon={MdOutlineSearchOff} title="No matching complaints" message="Try a different name or reference number." />
          ) : tab === 'submitted' ? (
            <EmptyState icon={MdOutlineTaskAlt} title="You're all caught up" message="There are no complaints waiting for review." />
          ) : (
            <EmptyState icon={MdOutlineBlock} title="No declined complaints" message="Complaints you decline will be listed here." />
          )
        ) : (
          <>
            <ul className="sm:hidden divide-y divide-border">
              {list.map((c) => {
                const w = waitInfo(c.created_at, now)
                return (
                  <li key={c.id}>
                    <Link to={`/admin/complaints/${c.id}`} className="block px-5 py-4 active:bg-surface-hover transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <span className="text-accent font-mono text-sm font-semibold">{c.reference_number}</span>
                        {tab === 'submitted' && <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${w.cls}`}>{w.label}</span>}
                      </div>
                      <div className="text-ink text-sm font-medium mb-0.5">{c.profiles?.full_name || c.complainant_name || '—'}</div>
                      <div className="text-ink-soft text-sm mb-2">{c.category}</div>
                      {tab === 'declined' && c.declined_reason && <div className="text-ink-faint text-xs mb-2 line-clamp-2">{c.declined_reason}</div>}
                      <div className="flex items-center justify-between">
                        <span className="text-ink-faint text-xs">{shortDate(tab === 'declined' && c.reviewed_at ? c.reviewed_at : c.created_at)}</span>
                        <span className="text-accent text-sm font-semibold flex items-center gap-1">
                          {tab === 'submitted' ? 'Review' : 'Open'} <MdArrowForward aria-hidden="true" />
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-ink-faint text-xs uppercase tracking-wide border-b border-border">
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">Ref. No.</th>
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">Complainant</th>
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">Category</th>
                    {tab === 'submitted' ? (
                      <>
                        <th className="px-5 py-3 font-semibold whitespace-nowrap">Submitted</th>
                        <th className="px-5 py-3 font-semibold whitespace-nowrap">Waiting</th>
                      </>
                    ) : (
                      <>
                        <th className="px-5 py-3 font-semibold whitespace-nowrap">Declined on</th>
                        <th className="px-5 py-3 font-semibold whitespace-nowrap">Reason</th>
                      </>
                    )}
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => {
                    const w = waitInfo(c.created_at, now)
                    return (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                        <td className="px-5 py-3.5 text-accent font-mono text-sm whitespace-nowrap">{c.reference_number}</td>
                        <td className="px-5 py-3.5 text-ink text-sm">{c.profiles?.full_name || c.complainant_name || '—'}</td>
                        <td className="px-5 py-3.5 text-ink-soft text-sm">{c.category}</td>
                        {tab === 'submitted' ? (
                          <>
                            <td className="px-5 py-3.5 text-ink-faint text-sm whitespace-nowrap">{shortDate(c.created_at)}</td>
                            <td className="px-5 py-3.5">
                              <span className={`text-xs font-semibold rounded-full px-2.5 py-1 whitespace-nowrap ${w.cls}`}>{w.label}</span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-5 py-3.5 text-ink-faint text-sm whitespace-nowrap">{shortDate(c.reviewed_at || c.created_at)}</td>
                            <td className="px-5 py-3.5 text-ink-soft text-sm max-w-[260px] truncate">{c.declined_reason || '—'}</td>
                          </>
                        )}
                        <td className="px-5 py-3.5">
                          <Link to={`/admin/complaints/${c.id}`} className="text-accent text-sm font-semibold whitespace-nowrap flex items-center gap-1">
                            {tab === 'submitted' ? 'Review' : 'Open'} <MdArrowForward aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </AdminLayout>
  )
}

export default AdminComplaints
