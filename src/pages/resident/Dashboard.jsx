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

const IN_PROGRESS = ['summoned', 'mediation', 'pangkat_formed', 'pangkat_hearing']
const CLOSED = ['settled', 'cfa_issued', 'dismissed']

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

  const stats = {
    total: complaints.length,
    filed: complaints.filter((c) => c.status === 'filed').length,
    inProgress: complaints.filter((c) => IN_PROGRESS.includes(c.status)).length,
    closed: complaints.filter((c) => CLOSED.includes(c.status)).length,
  }

  const firstName = (profile?.full_name || 'Resident').split(' ')[0]
  const recent = complaints.slice(0, 5)

  return (
    <AppLayout title="Dashboard">
      {/* Welcome Banner */}
      <div className="bg-surface border border-border rounded-2xl px-5 md:px-6 py-5 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-token-md">
        <div>
          <h2 className="text-ink font-sans text-lg font-bold mb-0.5">
            Welcome back, {firstName}! 👋
          </h2>
          <p className="text-ink-soft font-sans text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          to="/complaints/new"
          className="bg-accent hover:bg-accent-hover text-accent-ink text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors text-center shadow-token-sm"
        >
          + New Report
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        {[
          { label: 'Total Reports', val: stats.total, color: 'text-accent' },
          { label: 'Filed', val: stats.filed, color: 'text-warning-strong' },
          { label: 'In Progress', val: stats.inProgress, color: 'text-info-strong' },
          { label: 'Closed', val: stats.closed, color: 'text-success-strong' },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-2xl p-4 md:p-5 shadow-token-md">
            <div className={`text-2xl md:text-3xl font-bold mb-1 ${s.color}`}>{s.val}</div>
            <div className="text-ink-soft text-xs md:text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_290px] gap-4 items-start">
        {/* Recent Reports */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-token-md">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-2">
            <div>
              <div className="text-ink text-[15px] font-semibold">Recent Reports</div>
              <div className="text-ink-faint text-xs mt-0.5">Your latest complaint submissions</div>
            </div>
            <Link to="/my-reports" className="text-accent text-sm font-semibold border border-border bg-surface-sunken rounded-lg px-3 py-1.5 flex-shrink-0">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-ink-faint text-sm">Loading...</div>
          ) : recent.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="text-ink font-medium mb-1">No reports yet</div>
              <div className="text-ink-faint text-sm mb-4">Submit your first complaint to get started</div>
              <Link
                to="/complaints/new"
                className="inline-block bg-accent hover:bg-accent-hover text-accent-ink text-sm font-semibold rounded-lg px-5 py-2.5 shadow-token-sm"
              >
                + Submit Complaint
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-ink-faint text-xs border-b border-border">
                    <th className="px-5 py-2.5">Reference No.</th>
                    <th className="px-5 py-2.5">Category</th>
                    <th className="px-5 py-2.5 hidden sm:table-cell">Date Filed</th>
                    <th className="px-5 py-2.5">Stage</th>
                    <th className="px-5 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((c) => {
                    const style = BADGES[c.status] || BADGES.filed
                    return (
                      <tr key={c.id} className="border-b border-border">
                        <td className="px-5 py-3 text-accent font-mono text-sm whitespace-nowrap">{c.reference_number}</td>
                        <td className="px-5 py-3 text-ink-soft text-sm">{c.category}</td>
                        <td className="px-5 py-3 text-ink-faint text-xs hidden sm:table-cell whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`${style.bg} ${style.text} text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap`}>
                            {style.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <Link to={`/track?ref=${c.reference_number}`} className="text-accent text-xs font-semibold whitespace-nowrap">
                            Track →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3.5">
          <div className="bg-accent-soft border border-accent/20 rounded-2xl p-5 shadow-token-md">
            <div className="text-ink text-sm font-bold mb-1.5">📝 File a Complaint</div>
            <div className="text-ink-soft text-sm mb-3.5 leading-relaxed">
              Submit a new complaint or incident report online.
            </div>
            <Link
              to="/complaints/new"
              className="block text-center bg-surface hover:bg-surface-hover text-ink border border-border rounded-lg py-2.5 text-sm font-semibold transition-colors"
            >
              + New Report
            </Link>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4.5 shadow-token-md">
            <div className="text-ink text-sm font-semibold mb-1">🔍 Quick Track</div>
            <div className="text-ink-faint text-xs mb-2.5">Enter your reference number</div>
            <form className="flex gap-2">
              <input
                type="text"
                placeholder="KP-2026-XXX"
                className="flex-1 min-w-0 bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              <button type="submit" className="bg-accent hover:bg-accent-hover text-accent-ink rounded-md px-4 py-2 text-sm font-semibold flex-shrink-0">
                Go
              </button>
            </form>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4.5 shadow-token-md">
            <div className="text-ink text-sm font-semibold mb-2">ℹ️ Need Help?</div>
            <div className="text-ink-faint text-sm leading-relaxed">
              Visit the barangay office at <strong className="text-ink-soft">8AM–5PM</strong> Mon–Fri, or call your barangay hotline for urgent concerns.
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard