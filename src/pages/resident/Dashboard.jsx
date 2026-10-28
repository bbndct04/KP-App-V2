import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MdOutlineFolderCopy,
  MdOutlineSupportAgent,
  MdOutlinePendingActions,
  MdOutlineAssignment,
  MdAdd,
  MdArrowForward,
} from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'
import { Card, CardHeader, EmptyState, Skeleton, SkeletonRows, LinkButton } from '../../components/ui'
import { HearingCard, CaseRow } from '../../components/cases'
import { ACTIVE_STAGES } from '../../components/status'
import { upcomingHearings } from '../../lib/cases'

function Dashboard() {
  const { user, profile } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

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

  const firstName = (profile?.full_name || '').split(' ')[0]
  const nextHearing = upcomingHearings(complaints)[0]
  const awaiting = complaints.filter((c) => c.status === 'submitted')
  const open = complaints.filter((c) => c.status === 'submitted' || ACTIVE_STAGES.includes(c.status))
  const closedCount = complaints.length - open.length

  return (
    <AppLayout title="Home">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h2 className="text-ink text-xl md:text-2xl font-bold truncate">{firstName ? `Hello, ${firstName}!` : 'Hello!'}</h2>
          <p className="text-ink-soft text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="hidden md:block flex-shrink-0">
          <LinkButton to="/complaints/new" icon={MdAdd}>File a Complaint</LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="flex flex-col gap-5 min-w-0">
          {loading ? (
            <Skeleton className="h-[220px] rounded-2xl" />
          ) : (
            nextHearing && (
              <div className="lg:hidden">
                <HearingCard complaint={nextHearing} />
              </div>
            )
          )}

          {!loading && awaiting.length > 0 && (
            <div className="flex gap-3 bg-warning-soft border border-warning-strong/25 rounded-2xl p-4 text-warning-strong">
              <MdOutlinePendingActions className="text-2xl flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm leading-relaxed">
                <div className="font-bold text-base">
                  {awaiting.length === 1 ? 'Your complaint is' : `${awaiting.length} complaints are`} waiting for review
                </div>
                Please visit the Barangay Hall within 24 hours of filing (8AM–5PM, Monday to Friday) so the barangay can accept it.
              </div>
            </div>
          )}

          <Card className="overflow-hidden">
            <CardHeader
              icon={MdOutlineAssignment}
              title="Your active cases"
              subtitle={loading ? ' ' : `${open.length} active · ${closedCount} closed`}
              action={
                complaints.length > 0 && (
                  <Link to="/my-reports" className="text-accent text-sm font-semibold flex items-center gap-1 flex-shrink-0">
                    All cases <MdArrowForward aria-hidden="true" />
                  </Link>
                )
              }
            />
            {loading ? (
              <SkeletonRows rows={3} />
            ) : open.length === 0 ? (
              <EmptyState
                icon={MdOutlineFolderCopy}
                title={complaints.length ? 'No active cases' : 'No complaints yet'}
                message={
                  complaints.length
                    ? 'All your cases are closed. You can view them in All cases.'
                    : 'If you have a dispute with a neighbor or another resident, you can file a complaint here.'
                }
                action={<LinkButton to="/complaints/new" icon={MdAdd}>File a Complaint</LinkButton>}
              />
            ) : (
              <ul className="divide-y divide-border stagger">
                {open.map((c) => (
                  <li key={c.id}>
                    <CaseRow complaint={c} to={`/track?ref=${c.reference_number}`} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {!loading && nextHearing && (
            <div className="hidden lg:block">
              <HearingCard complaint={nextHearing} />
            </div>
          )}

          <Card className="p-5">
            <div className="flex items-center gap-2.5 mb-2">
              <MdOutlineSupportAgent className="text-xl text-accent" aria-hidden="true" />
              <div className="text-ink text-base font-semibold">Need help?</div>
            </div>
            <div className="text-ink-soft text-sm leading-relaxed">
              Visit the Barangay Hall at <strong className="text-ink">8AM–5PM</strong>, Monday to Friday, or call your barangay hotline for urgent concerns.
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard
