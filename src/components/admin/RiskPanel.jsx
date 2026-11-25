import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MdOutlineShield, MdOutlineReportProblem, MdArrowForward } from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useT } from '../../i18n/LanguageContext'

const RISK_REASONS = {
  declined: '{n} complaint(s) declined in the last 90 days',
  not_confirmed: '{n} complaint(s) not confirmed in person',
  no_show: '{n} case(s) dismissed because the complainant did not appear',
  burst: '{n} complaints filed within one hour',
  new_account: 'Filed a complaint right after creating the account',
  same_respondent: '{n} complaints against the same person',
  same_id: 'Same ID as {n} other account(s)',
  same_name_dob: 'Same name and birthdate as {n} other account(s)',
  same_phone: 'Same contact number as {n} other account(s)',
  restricted_before: 'Online filing was restricted before',
}

const LEVELS = {
  low: { label: 'Low risk', cls: 'bg-success-soft text-success-strong' },
  medium: { label: 'Medium risk', cls: 'bg-warning-soft text-warning-strong' },
  high: { label: 'High risk', cls: 'bg-danger-soft text-danger-strong' },
}

export function RiskBadge({ level, className = '' }) {
  const { t } = useT()
  const l = LEVELS[level]
  if (!l) return null
  return <span className={`inline-flex items-center rounded-full text-xs font-semibold px-2.5 py-1 whitespace-nowrap ${l.cls} ${className}`}>{t(l.label)}</span>
}

export function RiskReasons({ reasons }) {
  const { t } = useT()
  return (
    <ul className="flex flex-col gap-1.5">
      {reasons.map((r) => (
        <li key={r.key} className="text-sm text-ink flex gap-2">
          <MdOutlineReportProblem className="text-base text-warning-strong flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {t(RISK_REASONS[r.key] || r.key, { n: r.n })}
            {r.users?.map((id, i) => (
              <Link key={id} to={`/admin/users/${id}`} className="ml-1.5 text-accent font-semibold inline-flex items-center gap-0.5">
                {t('Account {n}', { n: i + 1 })} <MdArrowForward aria-hidden="true" />
              </Link>
            ))}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function RiskPanel({ userId, className = '' }) {
  const { t } = useT()
  const [risk, setRisk] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase.rpc('account_risk', { p_user: userId }).then(({ data }) => {
      if (!cancelled) setRisk(data || null)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (!risk) return null
  const reasons = risk.reasons || []

  return (
    <div className={`bg-surface border border-border rounded-2xl p-5 shadow-token-md ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <MdOutlineShield className="text-xl text-accent" aria-hidden="true" />
          <div className="text-ink text-base font-semibold">{t('Warning signs')}</div>
        </div>
        <RiskBadge level={risk.level} />
      </div>
      {reasons.length === 0 ? (
        <p className="text-sm text-ink-soft">{t('No warning signs found for this account.')}</p>
      ) : (
        <>
          <RiskReasons reasons={reasons} />
          <p className="text-xs text-ink-faint mt-3 leading-relaxed">
            {t('These are signs only. The complaint must still be received. If unsure, require personal appearance.')}
          </p>
        </>
      )}
    </div>
  )
}
