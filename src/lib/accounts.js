export const POSITIONS = [
  'Punong Barangay',
  'Barangay Secretary',
  'Lupon Secretary',
  'Barangay Kagawad',
  'Lupon Member',
  'Barangay Treasurer',
  'Barangay Staff',
]

export function passwordProblem(pw) {
  if (pw.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password must include both letters and numbers.'
  return ''
}

export function accountState(p) {
  if (!p || !p.account_status || p.account_status === 'active') return 'active'
  if (p.status_until && new Date(p.status_until) <= new Date()) return 'active'
  return p.account_status
}

export function blockedMessage(p) {
  const until = p?.status_until
    ? ` until ${new Date(p.status_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
    : ''
  return `Your account has been blocked${until}.${p?.status_reason ? ` Reason: ${p.status_reason}.` : ''} Please visit the Barangay Hall if you think this is a mistake.`
}

export const isOfficial = (role) => role === 'admin' || role === 'staff'
