import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MdOutlineFolderCopy,
  MdOutlineInbox,
  MdOutlineHourglassTop,
  MdOutlineCheckCircle,
  MdOutlineNoteAdd,
  MdOutlineManageSearch,
  MdOutlineSupportAgent,
  MdOutlineHistory,
  MdAdd,
  MdArrowForward,
} from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'
import { Card, CardHeader, StatusBadge, EmptyState, SkeletonRows, LinkButton, Button, Input } from '../../components/ui'
import ComplaintCards from '../../components/ComplaintCards'

const IN_PROGRESS = ['summoned', 'mediation', 'pangkat_formed', 'pangkat_hearing']
const CLOSED = ['settled', 'cfa_issued', 'dismissed']

function Dashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [trackRef, setTrackRef] = useState('')

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

  function handleQuickTrack(e) {
    e.preventDefault()
    const ref = trackRef.trim().toUpperCase()
    if (ref) navigate(`/track?ref=${encodeURIComponent(ref)}`)
  }

  const stats = [
    { label: 'Total Reports', val: complaints.length, icon: MdOutlineFolderCopy, color: 'text-accent', bg: 'bg-accent-soft' },
    { label: 'Filed', val: complaints.filter((c) => c.status === 'filed').length, icon: MdOutlineInbox, color: 'text-warning-strong', bg: 'bg-warning-soft' },
    { label: 'In Progress', val: complaints.filter((c) => IN_PROGRESS.includes(c.status)).length, icon: MdOutlineHourglassTop, color: 'text-info-strong', bg: 'bg-info-soft' },
    { label: 'Closed', val: complaints.filter((c) => CLOSED.includes(c.status)).length, icon: MdOutlineCheckCircle, color: 'text-success-strong', bg: 'bg-success-soft' },
  ]

  const firstName = (profile?.full_name || 'Resident').split(' ')[0]
  const recent = complaints.slice(0, 5)

  return (
    <AppLayout title="Dashboard">
      <Card className="px-5 md:px-6 py-5 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-ink text-xl font-bold mb-0.5">Welcome back, {firstName}!</h2>
          <p className="text-ink-soft text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <LinkButton to="/complaints/new" icon={MdAdd}>
          New Report
        </LinkButton>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="p-4 md:p-5">
              <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
                <Icon className="text-xl" aria-hidden="true" />
              </div>
              <div className={`text-2xl md:text-3xl font-bold mb-0.5 ${s.color}`}>{loading ? '–' : s.val}</div>
              <div className="text-ink-soft text-sm">{s.label}</div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4 items-start">
        <Card className="overflow-hidden">
          <CardHeader
            icon={MdOutlineHistory}
            title="Recent Reports"
            subtitle="Your latest complaint submissions"
            action={
              <Link to="/my-reports" className="text-accent text-sm font-semibold flex items-center gap-1 flex-shrink-0">
                View all <MdArrowForward aria-hidden="true" />
              </Link>
            }
          />

          {loading ? (
            <SkeletonRows rows={4} />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={MdOutlineFolderCopy}
              title="No reports yet"
              message="Submit your first complaint to get started."
              action={
                <LinkButton to="/complaints/new" icon={MdAdd}>
                  Submit Complaint
                </LinkButton>
              }
            />
          ) : (
            <>
              <ComplaintCards complaints={recent} linkFor={(c) => `/track?ref=${c.reference_number}`} />
              <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-ink-faint text-xs uppercase tracking-wide border-b border-border">
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">Reference No.</th>
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">Category</th>
                    <th className="px-5 py-3 font-semibold whitespace-nowrap hidden sm:table-cell">Date Filed</th>
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">Stage</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((c) => (
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

        <div className="flex flex-col gap-4">
          <div className="bg-accent-soft border border-accent/20 rounded-2xl p-5 shadow-token-md">
            <div className="w-10 h-10 rounded-xl bg-surface text-accent flex items-center justify-center mb-3">
              <MdOutlineNoteAdd className="text-xl" aria-hidden="true" />
            </div>
            <div className="text-ink text-base font-bold mb-1">File a Complaint</div>
            <div className="text-ink-soft text-sm mb-4 leading-relaxed">Submit a new complaint or incident report online.</div>
            <LinkButton to="/complaints/new" variant="secondary" icon={MdAdd} className="w-full">
              New Report
            </LinkButton>
          </div>

          <Card className="p-5">
            <div className="flex items-center gap-2.5 mb-1">
              <MdOutlineManageSearch className="text-xl text-accent" aria-hidden="true" />
              <div className="text-ink text-base font-semibold">Quick Track</div>
            </div>
            <div className="text-ink-faint text-sm mb-3">Enter your reference number</div>
            <form onSubmit={handleQuickTrack} className="flex gap-2">
              <Input
                value={trackRef}
                onChange={(e) => setTrackRef(e.target.value)}
                placeholder="KP-2026-001"
                aria-label="Reference number"
                className="flex-1 min-w-0"
              />
              <Button type="submit" disabled={!trackRef.trim()}>
                Go
              </Button>
            </form>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2.5 mb-2">
              <MdOutlineSupportAgent className="text-xl text-accent" aria-hidden="true" />
              <div className="text-ink text-base font-semibold">Need Help?</div>
            </div>
            <div className="text-ink-soft text-sm leading-relaxed">
              Visit the barangay office at <strong className="text-ink">8AM–5PM</strong>, Monday to Friday, or call your barangay hotline for urgent concerns.
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard
