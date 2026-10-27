export const PAPER = {
  legal: { label: 'Legal (long bond)', css: '8.5in 13in', w: 816, h: 1248 },
  a4: { label: 'A4', css: 'A4', w: 794, h: 1123 },
  letter: { label: 'Letter', css: '8.5in 11in', w: 816, h: 1056 },
}

export const MARGIN_PX = 96

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function ordinal(n) {
  const v = n % 100
  if (v >= 11 && v <= 13) return `${n}th`
  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'
  return `${n}${suffix}`
}

export function dateParts(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '')
  if (!m) return null
  return { day: ordinal(Number(m[3])), month: MONTHS[Number(m[2]) - 1], year: m[1] }
}

export function manilaDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

export function timeParts(t) {
  if (!t) return { clock: '', period: '' }
  const [h, m] = t.split(':')
  const hour = parseInt(h, 10)
  return { clock: `${hour % 12 === 0 ? 12 : hour % 12}:${m}`, period: hour < 12 ? 'morning' : 'afternoon' }
}
