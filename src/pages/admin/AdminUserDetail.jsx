import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  MdArrowBack,
  MdArrowForward,
  MdOutlineMail,
  MdOutlinePhone,
  MdOutlineCalendarToday,
  MdOutlineLogin,
  MdOutlineFolderOpen,
  MdOutlineHistory,
  MdOutlineAdminPanelSettings,
  MdOutlineBlock,
  MdOutlineLockOpen,
  MdOutlineDoNotDisturbOn,
  MdOutlinePersonSearch,
} from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/toastContext'
import AdminLayout from '../../components/layout/AdminLayout'
import IdentityPanel from '../../components/admin/IdentityPanel'
import { Card, CardHeader, Button, Field, Select, StatusBadge, EmptyState, SkeletonRows, ConfirmDialog } from '../../components/ui'
import { POSITIONS, isOfficial } from '../../lib/accounts'
import { formatDate } from '../../lib/cases'
import { Avatar, UserBadges, StatusDialog } from '../../components/admin/UserBits'
import { useT } from '../../i18n/LanguageContext'

function formatDateTime(d) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Icon className="text-lg text-ink-faint flex-shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <div className="text-ink-faint text-xs">{label}</div>
        <div className="text-ink text-sm font-medium break-words">{value || '—'}</div>
      </div>
    </div>
  )
}

function AdminUserDetail() {
  const { t } = useT()
  const { id } = useParams()
  const { user: me } = useAuth()
  const toast = useToast()
  const [u, setU] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('resident')
  const [title, setTitle] = useState('')
  const [savingRole, setSavingRole] = useState(false)
  const [confirmRole, setConfirmRole] = useState(false)
  const [statusMode, setStatusMode] = useState(null)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const load = useCallback(async () => {
    const [{ data: list }, { data: cases }, { data: log }] = await Promise.all([
      supabase.rpc('admin_list_users'),
      supabase.from('complaints').select('id, reference_number, category, respondent_name, status, created_at').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('user_audit_log').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
    ])
    const found = (list || []).find((x) => x.id === id) || null
    setU(found)
    if (found) {
      setRole(isOfficial(found.role) ? 'admin' : 'resident')
      setTitle(found.official_title || '')
    }
    setComplaints(cases || [])
    setHistory(log || [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const self = u?.id === me?.id
  const official = u && isOfficial(u.role)
  const roleChanged = u && (role !== (official ? 'admin' : 'resident') || (role === 'admin' && title !== (u.official_title || '')))

  async function saveRole() {
    setSavingRole(true)
    const { error } = await supabase.rpc('set_user_role', { p_user: u.id, p_role: role, p_title: role === 'admin' ? title || null : null })
    setSavingRole(false)
    setConfirmRole(false)
    if (error) return toast.error(error.message)
    toast.success(t('Role updated.'))
    load()
  }

  async function restore() {
    setRestoring(true)
    const { error } = await supabase.rpc('set_account_status', { p_user: u.id, p_status: 'active', p_reason: null, p_days: null })
    setRestoring(false)
    setConfirmRestore(false)
    if (error) return toast.error(error.message)
    toast.success(t("{name}'s account has been restored.", { name: u.full_name }))
    load()
  }

  const back = (
    <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-accent text-sm font-semibold mb-4">
      <MdArrowBack aria-hidden="true" />{t('All users')}
    </Link>
  )

  if (loading) {
    return (
      <AdminLayout title={t('User')}>
        {back}
        <Card>
          <SkeletonRows rows={5} />
        </Card>
      </AdminLayout>
    )
  }

  if (!u) {
    return (
      <AdminLayout title={t('User')}>
        {back}
        <Card>
          <EmptyState icon={MdOutlinePersonSearch} title={t('User not found')} message={t('This account may have been deleted.')} />
        </Card>
      </AdminLayout>
    )
  }

  const limited = u.effective_status !== 'active'

  return (
    <AdminLayout title={t('User')}>
      {back}

      <Card className="p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar name={u.full_name} size="w-14 h-14 text-lg" />
          <div className="min-w-0 flex-1">
            <div className="text-ink text-xl font-bold">
              {u.full_name || '—'} {self && <span className="text-ink-faint text-base font-normal">{t('(You)')}</span>}
            </div>
            <div className="text-ink-faint text-sm mb-2 break-all">{u.email}</div>
            <UserBadges u={u} />
          </div>
        </div>
        {limited && (
          <div className="mt-4 bg-danger-soft border border-danger-strong/20 rounded-xl px-4 py-3 text-sm text-danger-strong">
            <div className="font-semibold">
              {u.effective_status === 'blocked' ? t('Blocked') : t('Restricted from online filing')}
              {u.status_until ? ` ${t('until {date}', { date: formatDateTime(u.status_until) })}` : ` ${t('until removed')}`}
            </div>
            {u.status_reason && <div className="mt-0.5">{t('Reason:')} {u.status_reason}</div>}
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="flex flex-col gap-5 min-w-0">
          {!official && <IdentityPanel userId={u.id} title={t('Identity')} onChange={load} />}

          <Card className="overflow-hidden">
            <CardHeader icon={MdOutlineFolderOpen} title={t('Complaints filed')} subtitle={`${complaints.length} total`} />
            {complaints.length === 0 ? (
              <EmptyState icon={MdOutlineFolderOpen} title={t('No complaints yet')} />
            ) : (
              <ul className="divide-y divide-border">
                {complaints.map((c) => (
                  <li key={c.id}>
                    <Link to={`/admin/complaints/${c.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-hover transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="text-ink text-sm font-semibold">{c.reference_number}</div>
                        <div className="text-ink-faint text-xs truncate">
                          {t(c.category)}
                          {c.respondent_name ? ` · ${t('against {b}', { b: c.respondent_name })}` : ''} · {formatDate(c.created_at)}
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                      <MdArrowForward className="text-accent flex-shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader icon={MdOutlineHistory} title={t('Account history')} subtitle={t('Role changes, verification, restrictions and ID views')} />
            {history.length === 0 ? (
              <EmptyState icon={MdOutlineHistory} title={t('No activity recorded yet')} />
            ) : (
              <ul className="divide-y divide-border">
                {history.map((h) => (
                  <li key={h.id} className="px-5 py-3">
                    <div className="text-ink text-sm">{h.details}</div>
                    <div className="text-ink-faint text-xs mt-0.5">
                      {h.actor_name || t('System')} · {formatDateTime(h.created_at)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card className="px-5 py-2">
            <InfoRow icon={MdOutlinePhone} label={t('Contact number')} value={u.contact_number} />
            <InfoRow icon={MdOutlineMail} label={t('Email')} value={`${u.email}${u.email_confirmed ? '' : ` (${t('not confirmed')})`}`} />
            <InfoRow icon={MdOutlineCalendarToday} label={t('Joined')} value={formatDate(u.created_at)} />
            <InfoRow icon={MdOutlineLogin} label={t('Last active')} value={u.last_sign_in_at ? formatDateTime(u.last_sign_in_at) : t('Never')} />
          </Card>

          <Card className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-ink font-semibold">
              <MdOutlineAdminPanelSettings className="text-xl text-accent" aria-hidden="true" /> Role & position
            </div>
            {self ? (
              <p className="text-ink-faint text-sm">{t("You can't change your own role. Ask another admin.")}</p>
            ) : (
              <>
                <Field label={t('Role')}>
                  <Select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="resident">{t('Resident')}</option>
                    <option value="admin">{t('Barangay official (admin)')}</option>
                  </Select>
                </Field>
                {role === 'admin' && (
                  <Field label={t('Position')} hint={t('Used to fill names on KP forms.')}>
                    <Select value={title} onChange={(e) => setTitle(e.target.value)}>
                      <option value="">{t('No position')}</option>
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                <Button disabled={!roleChanged || savingRole} onClick={() => setConfirmRole(true)}>
                  {t('Save role')}
                </Button>
              </>
            )}
          </Card>

          {!self && !official && (
            <Card className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-ink font-semibold">
                <MdOutlineBlock className="text-xl text-danger-strong" aria-hidden="true" />{t('Account access')}
              </div>
              {limited ? (
                <Button variant="secondary" icon={MdOutlineLockOpen} onClick={() => setConfirmRestore(true)}>
                  {u.effective_status === 'blocked' ? t('Unblock account') : t('Remove restriction')}
                </Button>
              ) : (
                <>
                  <p className="text-ink-faint text-sm">{t('Use this for spam, fake or abusive complaints.')}</p>
                  <Button variant="secondary" icon={MdOutlineDoNotDisturbOn} onClick={() => setStatusMode('restricted')}>
                    {t('Restrict online filing')}
                  </Button>
                  <Button variant="danger" icon={MdOutlineBlock} onClick={() => setStatusMode('blocked')}>
                    {t('Block account')}
                  </Button>
                </>
              )}
              {limited && u.effective_status === 'restricted' && (
                <Button variant="danger" icon={MdOutlineBlock} onClick={() => setStatusMode('blocked')}>
                  {t('Block account')}
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>

      <StatusDialog mode={statusMode} user={u} onClose={() => setStatusMode(null)} onDone={load} />
      <ConfirmDialog
        open={confirmRole}
        tone="primary"
        title={t('Change role?')}
        message={
          role === 'admin'
            ? t(title ? "{name} will get full admin access as {title}, including residents' IDs and all cases." : "{name} will get full admin access, including residents' IDs and all cases.", { name: u.full_name, title })
            : t('{name} will lose admin access and become a resident.', { name: u.full_name })
        }
        confirmLabel={t('Change role')}
        loading={savingRole}
        onConfirm={saveRole}
        onCancel={() => setConfirmRole(false)}
      />
      <ConfirmDialog
        open={confirmRestore}
        tone="primary"
        title={u.effective_status === 'blocked' ? t('Unblock this account?') : t('Remove restriction?')}
        message={t('{name} will be able to use the app and file complaints again.', { name: u.full_name })}
        confirmLabel={t('Restore access')}
        loading={restoring}
        onConfirm={restore}
        onCancel={() => setConfirmRestore(false)}
      />
    </AdminLayout>
  )
}

export default AdminUserDetail
