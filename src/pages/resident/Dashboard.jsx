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
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-5 md:px-6 py-5 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-white font-sans text-lg font-bold mb-0.5">
            Welcome back, {firstName}! 👋
          </h2>
          <p className="text-blue-200/60 font-sans text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          to="/complaints/new"
          className="bg-blue-500/80 hover:bg-blue-500 border border-blue-400/30 text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors text-center"
        >
          + New Report
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        {[
          { label: 'Total Reports', val: stats.total, color: 'text-blue-300' },
          { label: 'Filed', val: stats.filed, color: 'text-amber-300' },
          { label: 'In Progress', val: stats.inProgress, color: 'text-sky-300' },
          { label: 'Closed', val: stats.closed, color: 'text-green-300' },
        ].map((s) => (
          <div key={s.label} className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4 md:p-5">
            <div className={`text-2xl md:text-3xl font-bold mb-1 ${s.color}`}>{s.val}</div>
            <div className="text-blue-200/60 text-xs md:text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_290px] gap-4 items-start">
        {/* Recent Reports */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-2">
            <div>
              <div className="text-white text-[15px] font-semibold">Recent Reports</div>
              <div className="text-blue-200/50 text-xs mt-0.5">Your latest complaint submissions</div>
            </div>
            <Link to="/my-reports" className="text-blue-300 text-sm font-semibold border border-white/20 bg-white/5 rounded-lg px-3 py-1.5 flex-shrink-0">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-blue-200/50 text-sm">Loading...</div>
          ) : recent.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="text-white/80 font-medium mb-1">No reports yet</div>
              <div className="text-blue-200/50 text-sm mb-4">Submit your first complaint to get started</div>
              <Link
                to="/complaints/new"
                className="inline-block bg-blue-500/80 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg px-5 py-2.5 border border-blue-400/30"
              >
                + Submit Complaint
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-blue-200/50 text-xs border-b border-white/10">
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
                      <tr key={c.id} className="border-b border-white/5">
                        <td className="px-5 py-3 text-blue-300 font-mono text-sm whitespace-nowrap">{c.reference_number}</td>
                        <td className="px-5 py-3 text-blue-100/80 text-sm">{c.category}</td>
                        <td className="px-5 py-3 text-blue-200/50 text-xs hidden sm:table-cell whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`${style.bg} ${style.text} text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap`}>
                            {style.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <Link to={`/track?ref=${c.reference_number}`} className="text-blue-300 text-xs font-semibold whitespace-nowrap">
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
          <div className="bg-blue-500/15 backdrop-blur-xl border border-blue-400/20 rounded-2xl p-5">
            <div className="text-white text-sm font-bold mb-1.5">📝 File a Complaint</div>
            <div className="text-blue-200/60 text-[13px] mb-3.5 leading-relaxed">
              Submit a new complaint or incident report online.
            </div>
            <Link
              to="/complaints/new"
              className="block text-center bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-lg py-2.5 text-sm font-semibold transition-colors"
            >
              + New Report
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4.5">
            <div className="text-white text-sm font-semibold mb-1">🔍 Quick Track</div>
            <div className="text-blue-200/50 text-xs mb-2.5">Enter your reference number</div>
            <form className="flex gap-2">
              <input
                type="text"
                placeholder="KP-2026-XXX"
                className="flex-1 min-w-0 bg-white/10 border border-white/20 text-white placeholder-blue-200/30 rounded-md px-2.5 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
              <button type="submit" className="bg-blue-500/80 hover:bg-blue-500 text-white rounded-md px-4 py-2 text-[13px] font-semibold flex-shrink-0">
                Go
              </button>
            </form>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4.5">
            <div className="text-white text-sm font-semibold mb-2">ℹ️ Need Help?</div>
            <div className="text-blue-200/50 text-[12.5px] leading-relaxed">
              Visit the barangay office at <strong className="text-blue-200/80">8AM–5PM</strong> Mon–Fri, or call your barangay hotline for urgent concerns.
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard