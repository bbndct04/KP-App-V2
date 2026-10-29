import { createPortal } from 'react-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MdSearch,
  MdOutlineGroups,
  MdOutlineSearchOff,
  MdOutlineAdminPanelSettings,
  MdOutlinePendingActions,
  MdOutlineBlock,
  MdOutlinePersonAddAlt,
  MdOutlineFiberNew,
  MdArrowForward,
  MdClose,
} from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/layout/AdminLayout'
import { useToast } from '../../context/toastContext'
import { Card, Input, Select, EmptyState, SkeletonRows, Button, Field } from '../../components/ui'
import { POSITIONS, isOfficial } from '../../lib/accounts'
import { Avatar, UserBadges } from '../../components/admin/UserBits'
import { formatDate } from '../../lib/cases'

const PAGE_SIZE = 20

const TABS = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'unverified', label: 'Needs verification', test: (u) => !isOfficial(u.role) && !u.verified_at },
  { key: 'verified', label: 'Verified', test: (u) => !isOfficial(u.role) && !!u.verified_at },
  { key: 'officials', label: 'Officials', test: (u) => isOfficial(u.role) },
  { key: 'limited', label: 'Restricted & blocked', test: (u) => u.effective_status !== 'active' },
]

function InviteDialog({ open, onClose, onInvited }) {
  const toast = useToast()
  const [form, setForm] = useState({ full_name: '', email: '', title: '' })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSending(true)
    const { data, error: fnError } = await supabase.functions.invoke('invite-official', {
      body: { ...form, redirect_to: `${window.location.origin}/reset-password?invite=1` },
    })
    setSending(false)
    if (fnError || data?.error) {
      let message = data?.error
      if (!message && fnError?.context?.json) message = (await fnError.context.json().catch(() => null))?.error
      setError(message || fnError?.message || 'The invitation could not be sent.')
      return
    }
    toast.success(`Invitation sent to ${form.email}.`)
    setForm({ full_name: '', email: '', title: '' })
    onInvited()
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-5" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-2xl p-6 max-w-[460px] w-full shadow-token-lg flex flex-col gap-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-ink text-lg font-bold">Invite a barangay official</div>
            <div className="text-ink-soft text-sm mt-0.5">They will get an email to set their password. Their account will have admin access.</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-faint hover:text-ink p-1">
            <MdClose className="text-xl" aria-hidden="true" />
          </button>
        </div>
        <Field label="Full name" required>
          <Input value={form.full_name} onChange={set('full_name')} required placeholder="e.g. Maria Santos" />
        </Field>
        <Field label="Email" required>
          <Input type="email" value={form.email} onChange={set('email')} required placeholder="official@example.com" />
        </Field>
        <Field label="Position" required>
          <Select value={form.title} onChange={set('title')} required>
            <option value="">Choose a position</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        {error && (
          <div role="alert" className="bg-danger-soft border border-danger-strong/20 text-danger-strong text-sm rounded-lg px-3.5 py-2.5">
            {error}
          </div>
        )}
        <div className="flex gap-2.5 justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button type="submit" icon={MdOutlinePersonAddAlt} disabled={sending}>
            {sending ? 'Sending...' : 'Send invitation'}
          </Button>
        </div>
      </form>
    </div>,
    document.body
  )
}

function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [inviteOpen, setInviteOpen] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_list_users')
    setUsers(data || [])
    setLoadError(error ? error.message : '')
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const residents = users.filter((u) => !isOfficial(u.role))
  const stats = [
    { label: 'Residents', val: residents.length, icon: MdOutlineGroups, color: 'text-accent', bg: 'bg-accent-soft' },
    { label: 'Needs verification', val: residents.filter((u) => !u.verified_at).length, icon: MdOutlinePendingActions, color: 'text-warning-strong', bg: 'bg-warning-soft', tab: 'unverified' },
    { label: 'Officials', val: users.length - residents.length, icon: MdOutlineAdminPanelSettings, color: 'text-purple-strong', bg: 'bg-purple-soft', tab: 'officials' },
    { label: 'Restricted & blocked', val: users.filter((u) => u.effective_status !== 'active').length, icon: MdOutlineBlock, color: 'text-danger-strong', bg: 'bg-danger-soft', tab: 'limited' },
    { label: 'New this month', val: users.filter((u) => new Date(u.created_at) >= monthStart).length, icon: MdOutlineFiberNew, color: 'text-info-strong', bg: 'bg-info-soft' },
  ]

  const filtered = useMemo(() => {
    const t = TABS.find((x) => x.key === tab)
    const s = search.trim().toLowerCase()
    return users.filter(
      (u) =>
        t.test(u) &&
        (!s || u.full_name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.contact_number?.replace(/\D/g, '').includes(s.replace(/\D/g, '') || '\u0000'))
    )
  }, [users, tab, search])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const goTab = (key) => {
    setTab(key)
    setPage(1)
  }

  return (
    <AdminLayout title="Manage Users">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <p className="text-ink-soft text-sm">Verify residents, manage officials, and restrict accounts that misuse the app.</p>
        <Button icon={MdOutlinePersonAddAlt} onClick={() => setInviteOpen(true)} className="flex-shrink-0">
          Invite official
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5 stagger">
        {stats.map((s, i) => {
          const Icon = s.icon
          const Tag = s.tab ? 'button' : 'div'
          return (
            <Tag
              key={s.label}
              onClick={s.tab ? () => goTab(s.tab) : undefined}
              className={`text-left bg-surface border border-border rounded-2xl p-4 shadow-token-md ${s.tab ? 'lift cursor-pointer' : ''} ${i === stats.length - 1 ? 'col-span-2 md:col-span-1' : ''}`}
            >
              <div className={`w-9 h-9 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-2.5`}>
                <Icon className="text-lg" aria-hidden="true" />
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{loading ? '–' : s.val}</div>
              <div className="text-ink-soft text-xs mt-0.5">{s.label}</div>
            </Tag>
          )
        })}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 mb-3 md:mx-0 md:px-0 md:flex-wrap">
        {TABS.map((t) => {
          const count = users.filter(t.test).length
          return (
            <button
              key={t.key}
              onClick={() => goTab(t.key)}
              aria-pressed={tab === t.key}
              className={`h-10 px-4 rounded-full text-sm font-semibold border transition-colors whitespace-nowrap flex-shrink-0 ${
                tab === t.key ? 'bg-accent border-accent text-accent-ink' : 'bg-surface border-border text-ink-soft hover:bg-surface-hover'
              }`}
            >
              {t.label} {!loading && <span className="ml-1 opacity-80">{count}</span>}
            </button>
          )
        })}
      </div>

      <Card className="p-4 mb-4">
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-ink-faint pointer-events-none" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name, email or contact number"
            aria-label="Search users"
            className="pl-10"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <SkeletonRows rows={6} />
        ) : loadError ? (
          <EmptyState
            icon={MdOutlineSearchOff}
            title="Users could not be loaded"
            message={`${loadError}. Make sure the user management SQL update has been run in Supabase.`}
          />
        ) : shown.length === 0 ? (
          <EmptyState icon={search ? MdOutlineSearchOff : MdOutlineGroups} title={search ? 'No matching users' : 'No users here'} message={search ? 'Try a different name, email or number.' : undefined} />
        ) : (
          <>
            <ul className="md:hidden divide-y divide-border stagger">
              {shown.map((u) => (
                <li key={u.id}>
                  <Link to={`/admin/users/${u.id}`} className="flex items-start gap-3 px-4 py-3.5 active:bg-surface-hover">
                    <Avatar name={u.full_name} />
                    <div className="min-w-0 flex-1">
                      <div className="text-ink text-sm font-semibold truncate">
                        {u.full_name || '—'} {u.id === currentUser?.id && <span className="text-ink-faint font-normal">(You)</span>}
                      </div>
                      <div className="text-ink-faint text-xs truncate mb-1.5">{u.email}</div>
                      <UserBadges u={u} />
                    </div>
                    <MdArrowForward className="text-accent mt-1 flex-shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-ink-faint text-xs uppercase tracking-wide border-b border-border">
                    <th className="px-5 py-3 font-semibold">User</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Complaints</th>
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">Joined</th>
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">Last active</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="stagger">
                  {shown.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.full_name} />
                          <div className="min-w-0">
                            <div className="text-ink text-sm font-semibold whitespace-nowrap">
                              {u.full_name || '—'} {u.id === currentUser?.id && <span className="text-ink-faint font-normal">(You)</span>}
                            </div>
                            <div className="text-ink-faint text-xs truncate max-w-[240px]">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <UserBadges u={u} />
                      </td>
                      <td className="px-5 py-3 text-ink text-sm font-semibold">{u.complaint_count}</td>
                      <td className="px-5 py-3 text-ink-faint text-sm whitespace-nowrap">{formatDate(u.created_at)}</td>
                      <td className="px-5 py-3 text-ink-faint text-sm whitespace-nowrap">{u.last_sign_in_at ? formatDate(u.last_sign_in_at) : 'Never'}</td>
                      <td className="px-5 py-3">
                        <Link to={`/admin/users/${u.id}`} className="text-accent text-sm font-semibold whitespace-nowrap flex items-center gap-1">
                          View <MdArrowForward aria-hidden="true" />
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

      {!loading && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 mt-4">
          <span className="text-ink-faint text-sm">
            {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={current === pages} onClick={() => setPage(current + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} onInvited={load} />
    </AdminLayout>
  )
}

export default AdminUsers
