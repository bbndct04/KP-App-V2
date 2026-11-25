import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MdOutlineHistory, MdOutlineGroups, MdOutlineSearchOff, MdArrowForward } from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import AdminLayout from '../../components/layout/AdminLayout'
import { Card, CardHeader, Select, EmptyState, SkeletonRows } from '../../components/ui'
import { useT } from '../../i18n/LanguageContext'

const ACTIONS = {
  id_viewed: "Viewed a resident's ID",
  identity_verified: 'Verified an identity',
  verification_removed: 'Removed a verification',
  role_changed: 'Changed a role',
  position_changed: 'Changed a position',
  account_restricted: 'Restricted an account',
  account_blocked: 'Blocked an account',
  account_restored: 'Restored an account',
  official_invited: 'Invited an official',
  complaint_accepted: 'Accepted a complaint',
  complaint_declined: 'Declined a complaint',
  appearance_required: 'Required personal appearance',
  walk_in_filed: 'Filed a walk-in complaint',
  stage_change: 'Changed a case stage',
  form_issued: 'Issued a KP form',
  form_voided: 'Voided a KP form',
  note: 'Added a case note',
  record_released: 'Released a case record',
}

const CATEGORIES = [
  { value: '', label: 'All activity' },
  { value: 'account', label: 'Accounts and IDs' },
  { value: 'case', label: 'Complaints and cases' },
  { value: 'record', label: 'Records released' },
]

const COLUMNS = [
  { key: 'complaint_accepted', label: 'Accepted' },
  { key: 'complaint_declined', label: 'Declined' },
  { key: 'id_viewed', label: 'IDs viewed' },
  { key: 'form_issued', label: 'Forms issued' },
  { key: 'record_released', label: 'Records released' },
]

function when(d) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function AdminActivity() {
  const { t } = useT()
  const [days, setDays] = useState(30)
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [actor, setActor] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    let cancelled = false
    supabase.rpc('admin_activity', { p_days: days }).then(({ data, error: e }) => {
      if (cancelled) return
      setRows(data || [])
      setError(e ? e.message : '')
    })
    return () => {
      cancelled = true
    }
  }, [days])

  const officials = useMemo(() => {
    const map = new Map()
    for (const r of rows || []) {
      if (!r.actor_id) continue
      const o = map.get(r.actor_id) || { id: r.actor_id, name: r.actor_name || '—', total: 0, counts: {} }
      o.total++
      o.counts[r.action] = (o.counts[r.action] || 0) + 1
      map.set(r.actor_id, o)
    }
    return [...map.values()].sort((a, b) => b.total - a.total)
  }, [rows])

  const feed = (rows || []).filter((r) => (!actor || r.actor_id === actor) && (!category || r.category === category)).slice(0, 300)
  const loading = rows === null

  return (
    <AdminLayout title={t('Admin Activity')}>
      <p className="text-ink-soft text-sm mb-4">{t('What each official did in the system. Every action is recorded and cannot be edited.')}</p>

      <div className="flex flex-wrap gap-2.5 mb-4">
        <Select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label={t('Period')} className="w-auto">
          {[7, 30, 90].map((n) => (
            <option key={n} value={n}>
              {t('Last {n} days', { n })}
            </option>
          ))}
        </Select>
        <Select value={actor} onChange={(e) => setActor(e.target.value)} aria-label={t('Official')} className="w-auto">
          <option value="">{t('All officials')}</option>
          {officials.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t('Type')} className="w-auto">
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {t(c.label)}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <div role="alert" className="bg-danger-soft border border-danger-strong/20 text-danger-strong text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <Card className="mb-4">
        <CardHeader icon={MdOutlineGroups} title={t('Summary per official')} subtitle={t('Last {n} days', { n: days })} />
        {loading ? (
          <SkeletonRows rows={3} />
        ) : officials.length === 0 ? (
          <EmptyState icon={MdOutlineHistory} title={t('No activity yet')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-ink-faint text-xs uppercase tracking-wide border-b border-border">
                  <th className="px-5 py-3 font-semibold whitespace-nowrap">{t('Official')}</th>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className="px-4 py-3 font-semibold whitespace-nowrap text-right">
                      {t(c.label)}
                    </th>
                  ))}
                  <th className="px-5 py-3 font-semibold whitespace-nowrap text-right">{t('All actions')}</th>
                </tr>
              </thead>
              <tbody>
                {officials.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-ink text-sm font-semibold whitespace-nowrap">
                      <button type="button" onClick={() => setActor(o.id)} className="hover:text-accent">
                        {o.name}
                      </button>
                    </td>
                    {COLUMNS.map((c) => (
                      <td key={c.key} className="px-4 py-3 text-sm text-right tabular-nums text-ink">
                        {o.counts[c.key] || 0}
                      </td>
                    ))}
                    <td className="px-5 py-3 text-sm text-right tabular-nums text-ink font-semibold">{o.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader icon={MdOutlineHistory} title={t('Activity log')} subtitle={t('Newest first')} />
        {loading ? (
          <SkeletonRows rows={6} />
        ) : feed.length === 0 ? (
          <EmptyState icon={MdOutlineSearchOff} title={t('No matching activity')} message={t('Try another official, type, or period.')} />
        ) : (
          <ul className="divide-y divide-border">
            {feed.map((r, i) => {
              const link = r.complaint_id ? `/admin/complaints/${r.complaint_id}` : r.target_user ? `/admin/users/${r.target_user}` : null
              return (
                <li key={i} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                  <div className="text-xs text-ink-faint sm:w-28 flex-shrink-0 pt-0.5 tabular-nums">{when(r.at)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink">
                      <span className="font-semibold">{r.actor_name || '—'}</span> · {t(ACTIONS[r.action] || r.action)}
                      {r.reference_number && <span className="font-mono text-accent"> · {r.reference_number}</span>}
                      {r.target_name && <span> · {r.target_name}</span>}
                    </div>
                    {r.details && <div className="text-xs text-ink-soft mt-0.5 break-words">{r.details}</div>}
                  </div>
                  {link && (
                    <Link to={link} className="text-sm font-semibold text-accent inline-flex items-center gap-1 flex-shrink-0">
                      {t('Open')} <MdArrowForward aria-hidden="true" />
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </AdminLayout>
  )
}

export default AdminActivity
