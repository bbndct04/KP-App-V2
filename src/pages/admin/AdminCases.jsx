import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MdSearch, MdOutlineAssignment, MdOutlineSearchOff, MdArrowForward, MdOutlineAddCircleOutline } from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import AdminLayout from '../../components/layout/AdminLayout'
import { Card, Input, Select, StatusBadge, EmptyState, SkeletonRows, LinkButton } from '../../components/ui'
import ComplaintCards from '../../components/ComplaintCards'
import { STATUS, ACTIVE_STAGES, CLOSED_STAGES } from '../../components/status'
import { DeadlineBadge, WalkInBadge } from '../../components/cases'
import { caseDeadline, loadStageDates } from '../../lib/cases'
import { useT } from '../../i18n/LanguageContext'

const URGENCY = { danger: 0, warning: 1, neutral: 2 }

const ACCEPTED = [...ACTIVE_STAGES, ...CLOSED_STAGES]

function AdminCases() {
  const { t } = useT()
  const navigate = useNavigate()
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('all')
  const [stageDates, setStageDates] = useState({})

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('complaints')
        .select('*, profiles(full_name)')
        .in('status', ACCEPTED)
        .order('created_at', { ascending: false })
      const active = (data || []).filter((c) => ACTIVE_STAGES.includes(c.status)).map((c) => c.id)
      setStageDates(await loadStageDates(active))
      setCases(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const stages = tab === 'active' ? ACTIVE_STAGES : CLOSED_STAGES
  const inTab = cases.filter((c) => stages.includes(c.status))
  const activeCount = cases.filter((c) => ACTIVE_STAGES.includes(c.status)).length
  const closedCount = cases.filter((c) => CLOSED_STAGES.includes(c.status)).length

  const deadlineOf = (c) => (tab === 'active' ? caseDeadline(c, stageDates[c.id]) : null)
  const s = search.trim().toLowerCase()
  const filteredList = inTab.filter((c) => {
    const matchesStage = stage === 'all' || c.status === stage
    const matchesSearch =
      !s ||
      c.reference_number?.toLowerCase().includes(s) ||
      c.category?.toLowerCase().includes(s) ||
      c.profiles?.full_name?.toLowerCase().includes(s) ||
      c.respondent_name?.toLowerCase().includes(s)
    return matchesStage && matchesSearch
  })
  const list =
    tab === 'active'
      ? [...filteredList].sort((a, b) => URGENCY[deadlineOf(a)?.tone ?? 'neutral'] - URGENCY[deadlineOf(b)?.tone ?? 'neutral'])
      : filteredList

  function switchTab(key) {
    setTab(key)
    setStage('all')
  }

  const tabBtn = (key, label, count) => (
    <button
      key={key}
      onClick={() => switchTab(key)}
      aria-pressed={tab === key}
      className={`h-10 px-4 rounded-full text-sm font-semibold border transition-colors ${
        tab === key ? 'bg-accent border-accent text-accent-ink' : 'bg-surface border-border text-ink-soft hover:bg-surface-hover'
      }`}
    >
      {t(label)} <span className="ml-1 opacity-80">{count}</span>
    </button>
  )

  return (
    <AdminLayout title={t('Active Cases')}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-ink-soft text-sm">{t('Complaints you accepted and are handling')}</p>
        <LinkButton to="/admin/walk-in" variant="secondary" icon={MdOutlineAddCircleOutline}>
          {t('Walk-in complaint')}
        </LinkButton>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabBtn('active', 'Active', activeCount)}
        {tabBtn('closed', 'Closed', closedCount)}
      </div>

      <Card className="p-4 mb-5 flex gap-2.5 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px]">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-ink-faint pointer-events-none" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search by name or ref. no.')}
            aria-label={t('Search cases')}
            className="pl-10"
          />
        </div>
        <Select value={stage} onChange={(e) => setStage(e.target.value)} aria-label={t('Filter by stage')} className="w-auto min-w-[180px]">
          <option value="all">{t('All stages')}</option>
          {stages.map((key) => (
            <option key={key} value={key}>
              {t(STATUS[key].label)}
            </option>
          ))}
        </Select>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <SkeletonRows rows={6} />
        ) : list.length === 0 ? (
          s || stage !== 'all' ? (
            <EmptyState icon={MdOutlineSearchOff} title={t('No matching cases')} message={t('Try a different search or stage.')} />
          ) : (
            <EmptyState
              icon={MdOutlineAssignment}
              title={tab === 'active' ? t('No active cases') : t('No closed cases yet')}
              message={tab === 'active' ? t('Complaints you accept from New Complaints will appear here.') : t('Settled, dismissed, and CFA cases will appear here.')}
            />
          )
        ) : (
          <>
            <ComplaintCards
              complaints={list}
              linkFor={(c) => `/admin/cases/${c.id}`}
              linkLabel={t('Manage')}
              showResident
              renderExtra={(c) => <DeadlineBadge deadline={deadlineOf(c)} />}
            />
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-ink-faint text-xs uppercase tracking-wide border-b border-border">
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">{t('Case')}</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">{t('Resident')}</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">{t('Stage')}</th>
                    {tab === 'active' && <th className="px-4 py-3 font-semibold whitespace-nowrap">{t('Timeline')}</th>}
                    <th className={`px-4 py-3 sticky right-0 bg-surface shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)]`}></th>
                  </tr>
                </thead>
                <tbody className="stagger">
                  {list.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/admin/cases/${c.id}`)}
                      className="group border-b border-border last:border-0 hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3">
                        <div className="text-accent font-mono text-sm whitespace-nowrap flex items-center gap-1.5">
                          {c.reference_number}
                          <WalkInBadge complaint={c} />
                        </div>
                        <div className="text-ink-soft text-xs max-w-[240px] truncate">
                          {t(c.category)} · {new Date(c.reviewed_at || c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink text-sm max-w-[180px]">{c.profiles?.full_name || c.complainant_name || '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      {tab === 'active' && (
                        <td className="px-4 py-3 min-w-[150px] [&>span]:whitespace-normal [&>span]:rounded-lg">
                          <DeadlineBadge deadline={deadlineOf(c)} />
                        </td>
                      )}
                      <td className="px-4 py-3 sticky right-0 bg-surface group-hover:bg-surface-hover shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)]">
                        <Link
                          to={`/admin/cases/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 h-9 px-3.5 rounded-lg bg-accent text-accent-ink text-sm font-semibold whitespace-nowrap hover:bg-accent-hover"
                        >
                          Manage <MdArrowForward aria-hidden="true" />
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
      {!loading && list.length > 0 && (
        <div className="text-ink-faint text-sm mt-3">
          {t(tab === 'closed' ? 'Showing {n} of {total} closed cases' : 'Showing {n} of {total} active cases', { n: list.length, total: inTab.length })}
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminCases
