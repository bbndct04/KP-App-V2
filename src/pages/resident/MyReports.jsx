import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MdOutlineFolderCopy, MdOutlineFilterAltOff, MdAdd, MdArrowForward } from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'
import { Card, StatusBadge, EmptyState, SkeletonRows, LinkButton } from '../../components/ui'
import ComplaintCards from '../../components/ComplaintCards'
import { STATUS } from '../../components/status'

const FILTERS = [{ key: 'all', label: 'All' }, ...Object.entries(STATUS).map(([key, s]) => ({ key, label: s.label }))]

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
        <LinkButton to="/complaints/new" icon={MdAdd} className="flex-shrink-0">
          New Report
        </LinkButton>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 mb-4 md:flex-wrap md:overflow-visible md:mx-0 md:px-0 md:mb-5">
        {FILTERS.map((f) => {
          const count = countFor(f.key)
          const isActive = activeFilter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              aria-pressed={isActive}
              className={`h-9 px-4 rounded-full text-sm font-medium border transition-colors flex-shrink-0 whitespace-nowrap ${
                isActive
                  ? 'bg-accent border-accent text-accent-ink'
                  : 'bg-surface border-border text-ink-soft hover:bg-surface-hover'
              }`}
            >
              {f.label}
              {count > 0 && <span className="ml-1.5 opacity-80 font-bold">{count}</span>}
            </button>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <SkeletonRows rows={5} />
        ) : filtered.length === 0 ? (
          activeFilter === 'all' ? (
            <EmptyState
              icon={MdOutlineFolderCopy}
              title="No reports yet"
              message="You haven't submitted any complaints yet."
              action={
                <LinkButton to="/complaints/new" icon={MdAdd}>
                  Submit Complaint
                </LinkButton>
              }
            />
          ) : (
            <EmptyState
              icon={MdOutlineFilterAltOff}
              title="Nothing here"
              message={`You have no complaints at the "${STATUS[activeFilter]?.label}" stage.`}
            />
          )
        ) : (
          <>
            <ComplaintCards complaints={filtered} linkFor={(c) => `/track?ref=${c.reference_number}`} />
            <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-ink-faint text-xs uppercase tracking-wide border-b border-border">
                  <th className="px-5 py-3 font-semibold whitespace-nowrap">Reference No.</th>
                  <th className="px-5 py-3 font-semibold whitespace-nowrap">Category</th>
                  <th className="px-5 py-3 font-semibold whitespace-nowrap hidden sm:table-cell">Filed</th>
                  <th className="px-5 py-3 font-semibold whitespace-nowrap">Stage</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 text-accent font-mono text-sm whitespace-nowrap">{c.reference_number}</td>
                    <td className="px-5 py-3.5 text-ink-soft text-sm">{c.category}</td>
                    <td className="px-5 py-3.5 text-ink-faint text-sm hidden sm:table-cell whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/track?ref=${c.reference_number}`}
                        className="text-accent text-sm font-semibold whitespace-nowrap flex items-center gap-1"
                      >
                        Track <MdArrowForward aria-hidden="true" />
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
    </AppLayout>
  )
}

export default MyReports
