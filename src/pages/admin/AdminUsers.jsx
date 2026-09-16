import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/layout/AdminLayout'

const ROLE_BADGES = {
  admin: { bg: 'bg-purple-500/15', text: 'text-purple-300', label: 'Admin' },
  resident: { bg: 'bg-green-500/15', text: 'text-green-300', label: 'Resident' },
}

function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [savingId, setSavingId] = useState(null)

  async function load() {
    setLoading(true)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: complaints } = await supabase.from('complaints').select('user_id')
    const countMap = {}
    ;(complaints || []).forEach((c) => {
      countMap[c.user_id] = (countMap[c.user_id] || 0) + 1
    })

    setUsers(profiles || [])
    setCounts(countMap)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function changeRole(userId, newRole) {
    setSavingId(userId)
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setSavingId(null)
    load()
  }

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const s = search.toLowerCase()
    const matchesSearch = !s || u.full_name?.toLowerCase().includes(s)
    return matchesRole && matchesSearch
  })

  return (
    <AdminLayout title="Manage Users">
      <p className="text-blue-200/60 text-[13.5px] mb-4">Manage roles and access control</p>

      {/* Search + Filter */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4 mb-5 flex gap-2.5 flex-wrap items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="flex-1 min-w-[220px] bg-white/10 border border-white/20 text-white placeholder-blue-200/30 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white/10 border border-white/20 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 [color-scheme:dark]"
        >
          <option value="all">All Roles</option>
          <option value="resident">Residents</option>
          <option value="admin">Admins</option>
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
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Complaints</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Change Role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-14 text-blue-200/50">No users found</td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const b = ROLE_BADGES[u.role] || ROLE_BADGES.resident
                    const isSelf = u.id === currentUser?.id
                    const initials = (u.full_name || '??').substring(0, 2).toUpperCase()
                    return (
                      <tr key={u.id} className="border-b border-white/5">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-blue-500/80 flex items-center justify-center text-white text-xs font-bold border border-blue-300/30 flex-shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="text-white text-sm font-semibold">{u.full_name || '—'}</div>
                              {u.official_title && <div className="text-blue-200/50 text-[11px]">{u.official_title}</div>}
                              {isSelf && <div className="text-blue-200/40 text-[11px]">(You)</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`${b.bg} ${b.text} text-xs font-semibold px-2.5 py-1 rounded-full`}>{b.label}</span>
                        </td>
                        <td className="px-5 py-3.5 text-blue-300 font-bold text-sm">{counts[u.id] || 0}</td>
                        <td className="px-5 py-3.5 text-blue-200/50 text-xs">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          {isSelf ? (
                            <span className="text-blue-200/30 text-xs">—</span>
                          ) : (
                            <select
                              value={u.role}
                              disabled={savingId === u.id}
                              onChange={(e) => changeRole(u.id, e.target.value)}
                              className="bg-white/10 border border-white/20 text-white rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400/50 [color-scheme:dark] disabled:opacity-50"
                            >
                              <option value="resident">Resident</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
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

export default AdminUsers