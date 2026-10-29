import { supabase } from './supabaseClient'
import { STATUS } from '../components/status'

export const OPEN_STAGES = ['filed', 'summoned', 'mediation', 'pangkat_formed', 'pangkat_hearing', 'arbitration']
const PANGKAT = ['pangkat_formed', 'pangkat_hearing']

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

export function currentMonth() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }).slice(0, 7)
}

export function longDate(ts) {
  return ts ? new Date(ts).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }) : ''
}

export function shortDate(ts) {
  return ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }) : ''
}

export const stageLabel = (s) => STATUS[s]?.label || s

export const filedAt = (c) => c.reviewed_at || c.created_at

export async function loadOffice() {
  const [{ data: s }, { data: officials }] = await Promise.all([
    supabase.from('barangay_settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('profiles').select('full_name, official_title').in('role', ['admin', 'staff']).not('official_title', 'is', null).order('created_at'),
  ])
  const o = {}
  for (const p of officials || []) o[p.official_title] ??= p.full_name
  const settings = s || {}
  return {
    province: settings.province || '',
    localityType: settings.locality_type || 'City',
    locality: settings.locality || '',
    barangay: settings.barangay || '',
    punongBarangay: settings.punong_barangay || o['Punong Barangay'] || '',
    luponSecretary: o['Lupon Secretary'] || settings.secretary || o['Barangay Secretary'] || '',
  }
}

export function settlementMethod(c, logs) {
  if (c.settlement_type === 'arbitration_award') return 'arbitration'
  const idx = logs.findIndex((l) => l.stage === 'settled')
  const before = logs
    .slice(0, idx < 0 ? logs.length : idx)
    .reverse()
    .find((l) => l.stage !== 'settled')
  if (before && PANGKAT.includes(before.stage)) return 'conciliation'
  if (before?.stage === 'arbitration') return 'arbitration'
  return 'mediation'
}

export function buildMonthlyReport(ym, complaints, allLogs) {
  const start = Date.parse(`${ym}-01T00:00:00+08:00`)
  const [y, m] = ym.split('-').map(Number)
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
  const end = Date.parse(`${next}-01T00:00:00+08:00`)
  const inMonth = (t) => {
    const v = new Date(t).getTime()
    return v >= start && v < end
  }

  const logsBy = {}
  for (const l of allLogs) (logsBy[l.complaint_id] ??= []).push(l)
  for (const k in logsBy) logsBy[k].sort((a, b) => a.created_at.localeCompare(b.created_at))

  const sum = {
    carried: 0,
    filed: 0,
    settled: { mediation: 0, conciliation: 0, arbitration: 0 },
    repudiated: 0,
    cfa: 0,
    dismissed: 0,
    withdrawn: 0,
    complied: 0,
    pendingEnd: 0,
    declined: 0,
  }
  const natures = {}
  const rows = []

  for (const c of complaints) {
    if (c.status === 'declined') {
      if (c.reviewed_at && inMonth(c.reviewed_at)) sum.declined++
      continue
    }
    if (c.status === 'submitted') continue
    const filed = new Date(filedAt(c)).getTime()
    if (filed >= end) continue

    const logs = logsBy[c.id] || []
    const stageAt = (t) => {
      if (!logs.length) return t >= Date.now() ? c.status : 'filed'
      let s = 'filed'
      for (const l of logs) if (new Date(l.created_at).getTime() < t) s = l.stage
      return s
    }
    const newThisMonth = filed >= start
    const startStage = newThisMonth ? null : stageAt(start)
    const endStage = stageAt(end)
    const monthLogs = logs.filter((l) => inMonth(l.created_at))

    if (startStage && OPEN_STAGES.includes(startStage)) sum.carried++
    if (newThisMonth) {
      sum.filed++
      natures[c.category || 'Unspecified'] = (natures[c.category || 'Unspecified'] || 0) + 1
    }
    if (OPEN_STAGES.includes(endStage)) sum.pendingEnd++

    for (const l of monthLogs) {
      if (l.stage === 'settled') sum.settled[settlementMethod(c, logs)]++
      if (l.stage === 'cfa_issued') {
        sum.cfa++
        if (c.cfa_type === 'repudiated') sum.repudiated++
      }
      if (l.stage === 'dismissed') {
        sum.dismissed++
        if (c.dismissal_reason === 'withdrawn') sum.withdrawn++
      }
      if (l.stage === 'closed') sum.complied++
    }

    if (!newThisMonth && !monthLogs.length) continue
    const actions = [
      ...(newThisMonth ? [`Filed (${shortDate(filedAt(c))})`] : []),
      ...monthLogs.map((l) => `${stageLabel(l.stage)} (${shortDate(l.created_at)})`),
    ]
    rows.push({
      id: c.id,
      caseNo: c.reference_number,
      parties: `${c.complainant_name || '—'} vs. ${c.respondent_name || '—'}`,
      nature: c.category || '',
      filed: filedAt(c),
      actions,
      status: stageLabel(endStage),
    })
  }

  rows.sort((a, b) => a.filed.localeCompare(b.filed))
  const settledTotal = sum.settled.mediation + sum.settled.conciliation + sum.settled.arbitration
  return {
    sum: { ...sum, handled: sum.carried + sum.filed, settledTotal },
    natures: Object.entries(natures).sort((a, b) => b[1] - a[1]),
    rows,
  }
}
