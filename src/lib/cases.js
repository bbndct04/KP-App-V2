import { supabase } from './supabaseClient'

export const HEARING_STAGES = ['summoned', 'mediation', 'pangkat_formed', 'pangkat_hearing']
export const PROGRESS_STEPS = ['submitted', 'filed', 'summoned', 'mediation', 'pangkat_formed', 'pangkat_hearing', 'outcome']
const OUTCOMES = ['settled', 'cfa_issued', 'dismissed']

export function parseDate(d) {
  if (!d) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00`) : new Date(d)
}

export function todayStart() {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

export function formatDate(d, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  const date = parseDate(d)
  return date ? date.toLocaleDateString('en-US', opts) : ''
}

export function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h, 10)
  return `${hour % 12 === 0 ? 12 : hour % 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`
}

export function daysFromToday(d) {
  const date = parseDate(d)
  if (!date) return null
  date.setHours(0, 0, 0, 0)
  return Math.round((date - todayStart()) / 86400000)
}

export function relativeDay(d) {
  const n = daysFromToday(d)
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n > 1 && n < 7) return `In ${n} days`
  return formatDate(d, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function upcomingHearings(complaints) {
  return complaints
    .filter((c) => c.hearing_date && HEARING_STAGES.includes(c.status) && daysFromToday(c.hearing_date) >= 0)
    .sort((a, b) => `${a.hearing_date} ${a.hearing_time || ''}`.localeCompare(`${b.hearing_date} ${b.hearing_time || ''}`))
}

export function progressOf(status) {
  const idx = OUTCOMES.includes(status) ? PROGRESS_STEPS.length - 1 : PROGRESS_STEPS.indexOf(status)
  return { step: idx + 1, total: PROGRESS_STEPS.length, pct: Math.round(((idx + 1) / PROGRESS_STEPS.length) * 100) }
}

const elapsedDays = (from) => Math.floor((Date.now() - new Date(from).getTime()) / 86400000) + 1

export function caseDeadline(c, stageDates = {}) {
  if (c.status === 'submitted') {
    const days = elapsedDays(c.created_at)
    return days > 1 ? { label: 'Review overdue', tone: 'danger' } : null
  }
  if (c.status === 'filed') {
    const days = elapsedDays(c.reviewed_at || c.created_at)
    return days > 3 ? { label: 'Summons overdue', tone: 'danger' } : { label: `Day ${days} · issue summons`, tone: 'neutral' }
  }
  if (c.status === 'summoned' || c.status === 'mediation') {
    const days = elapsedDays(stageDates.summoned || c.reviewed_at || c.created_at)
    if (days > 15) return { label: `Mediation overdue · day ${days}`, tone: 'danger' }
    return { label: `Mediation day ${days} of 15`, tone: days >= 12 ? 'warning' : 'neutral' }
  }
  if (c.status === 'pangkat_formed' || c.status === 'pangkat_hearing') {
    const days = elapsedDays(stageDates.pangkat_formed || c.reviewed_at || c.created_at)
    if (days > 30) return { label: `Pangkat overdue · day ${days}`, tone: 'danger' }
    if (days > 15) return { label: `Extension day ${days} of 30`, tone: 'warning' }
    return { label: `Pangkat day ${days} of 15`, tone: days >= 12 ? 'warning' : 'neutral' }
  }
  return null
}

export async function loadStageDates(complaintIds) {
  if (!complaintIds.length) return {}
  const { data } = await supabase
    .from('case_activity_log')
    .select('complaint_id, stage, created_at')
    .eq('entry_type', 'stage_change')
    .in('stage', ['summoned', 'pangkat_formed'])
    .in('complaint_id', complaintIds)
  const map = {}
  for (const row of data || []) {
    map[row.complaint_id] ??= {}
    const prev = map[row.complaint_id][row.stage]
    if (!prev || row.created_at > prev) map[row.complaint_id][row.stage] = row.created_at
  }
  return map
}
