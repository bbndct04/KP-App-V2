import { useEffect, useState } from 'react'
import { MdSearch, MdOutlineGroups, MdOutlineSearchOff, MdOutlineAdminPanelSettings, MdOutlinePerson } from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/layout/AdminLayout'
import { useToast } from '../../context/toastContext'
import { Card, Input, Select, EmptyState, SkeletonRows, ConfirmDialog } from '../../components/ui'

const ROLES = {
  admin: { label: 'Admin', icon: MdOutlineAdminPanelSettings, className: 'bg-purple-soft text-purple-strong' },
  resident: { label: 'Resident', icon: MdOutlinePerson, className: 'bg-success-soft text-success-strong' },
}

function RoleBadge({ role }) {
  const r = ROLES[role] || ROLES.resident
  const Icon = r.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full text-xs font-semibold px-2.5 py-1 ${r.className}`}>
      <Icon className="text-[1.15em]" aria-hidden="true" />
      {r.label}
    </span>
  )
}

function AdminUsers() {
  const { user: currentUser } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [pending, setPending] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: profiles }, { data: complaints }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('complaints').select('user_id'),
      ])
      const countMap = {}
      ;(complaints || []).forEach((c) => {
        countMap[c.user_id] = (countMap[c.user_id] || 0) + 1
      })
      setUsers(profiles || [])
      setCounts(countMap)
      setLoading(false)
    }
    load()
  }, [])

  async function confirmRoleChange() {
    if (!pending) return
    setSaving(true)
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: pending.newRole })
      .eq('id', pending.user.id)
      .select('id')
    setSaving(false)

    if (error || !data?.length) {
      toast.error(`Couldn't change ${pending.user.full_name || 'this user'}'s role. ${error?.message || 'You may not have permission.'}`)
    } else {
      setUsers((list) => list.map((u) => (u.id === pending.user.id ? { ...u, role: pending.newRole } : u)))
      toast.success(`${pending.user.full_name || 'User'} is now ${ROLES[pending.newRole].label === 'Admin' ? 'an Admin' : 'a Resident'}.`)
    }
    setPending(null)
  }

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const s = search.trim().toLowerCase()
    const matchesSearch = !s || u.full_name?.toLowerCase().includes(s)
    return matchesRole && matchesSearch
  })

  const promoting = pending?.newRole === 'admin'

  return (
    <AdminLayout title="Manage Users">
      <p className="text-ink-soft text-sm mb-4">Manage roles and access control</p>


      <Card className="p-4 mb-5 flex gap-2.5 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px]">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-ink-faint pointer-events-none" aria-hidden="true" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" aria-label="Search users" className="pl-10" />
        </div>
        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter by role" className="w-auto min-w-[160px]">
          <option value="all">All Roles</option>
          <option value="resident">Residents</option>
          <option value="admin">Admins</option>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <SkeletonRows rows={6} />
        ) : filtered.length === 0 ? (
          users.length === 0 ? (
            <EmptyState icon={MdOutlineGroups} title="No users yet" />
          ) : (
            <EmptyState icon={MdOutlineSearchOff} title="No matching users" message="Try a different name or role filter." />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-ink-faint text-xs uppercase tracking-wide border-b border-border">
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Complaints</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 font-semibold">Change Role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isSelf = u.id === currentUser?.id
                  const initials = (u.full_name || '??').substring(0, 2).toUpperCase()
                  return (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-ink text-sm font-bold flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="text-ink text-sm font-semibold">
                              {u.full_name || '—'} {isSelf && <span className="text-ink-faint font-normal">(You)</span>}
                            </div>
                            {u.official_title && <div className="text-ink-faint text-xs">{u.official_title}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-5 py-3.5 text-accent font-bold text-sm">{counts[u.id] || 0}</td>
                      <td className="px-5 py-3.5 text-ink-faint text-sm whitespace-nowrap">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        {isSelf ? (
                          <span className="text-ink-faint text-sm">—</span>
                        ) : (
                          <Select
                            value={u.role}
                            onChange={(e) => {
                              setPending({ user: u, newRole: e.target.value })
                            }}
                            aria-label={`Change role for ${u.full_name || 'user'}`}
                            className="w-auto py-2"
                          >
                            <option value="resident">Resident</option>
                            <option value="admin">Admin</option>
                          </Select>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!pending}
        tone={promoting ? 'danger' : 'primary'}
        title={promoting ? 'Make this user an Admin?' : 'Change this user to Resident?'}
        message={
          promoting
            ? `${pending?.user.full_name || 'This user'} will get full access to the admin panel: all complaints, case management, legal forms, and user roles.`
            : `${pending?.user.full_name || 'This user'} will lose access to the admin panel and only see their own complaints.`
        }
        confirmLabel={promoting ? 'Yes, make Admin' : 'Yes, change to Resident'}
        loading={saving}
        onConfirm={confirmRoleChange}
        onCancel={() => setPending(null)}
      />
    </AdminLayout>
  )
}

export default AdminUsers
