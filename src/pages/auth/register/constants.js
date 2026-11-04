export const STEP_LABELS = [
  { label: 'Terms & Conditions', sub: 'Read and agree' },
  { label: 'Face Photo', sub: 'Live selfie check' },
  { label: 'Valid ID', sub: 'Primary government ID' },
  { label: 'Your Details', sub: 'Personal information' },
  { label: 'Create Account', sub: 'Set your password' },
  { label: 'Verify Email', sub: 'Open the link we send' },
]

export const ID_TYPES = [
  { value: 'national', label: 'Philippine National ID (PhilSys / ePhilID)' },
  { value: 'passport', label: 'Philippine Passport' },
  { value: 'drivers_license', label: "Driver's License (LTO)" },
  { value: 'umid', label: 'UMID (SSS / GSIS)' },
  { value: 'prc', label: 'PRC ID' },
  { value: 'postal', label: 'Postal ID (PHLPost)' },
]

export const ID_KEYWORDS = {
  national: ['philippine identification', 'pambansang pagkakakilanlan', 'philsys', 'phil id', 'philid', 'ephilid'],
  passport: ['passport', 'pasaporte', 'department of foreign affairs'],
  drivers_license: ["driver's license", 'drivers license', 'driver license', 'land transportation office', 'lto'],
  umid: ['unified multi-purpose', 'unified multi purpose', 'umid', 'crn'],
  prc: ['professional regulation commission', 'professional identification card'],
  postal: ['postal identity card', 'phlpost', 'philpost', 'philippine postal'],
}

export const MAX_ID_ATTEMPTS = 3

export const hasBack = (type) => !!type && type !== 'passport'

export function idMatches(text, type) {
  const lower = (text || '').toLowerCase()
  return (ID_KEYWORDS[type] || []).some((k) => lower.includes(k))
}

export function latestBirthDate() {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toLocaleDateString('en-CA')
}

export function ageOn(dob) {
  const today = new Date()
  const birth = new Date(`${dob}T00:00:00`)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}
