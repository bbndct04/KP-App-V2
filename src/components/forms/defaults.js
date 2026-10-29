import { manilaDate, timeParts } from '../../lib/formsKit'

function barangayFields(s = {}) {
  const o = s.officials || {}
  const punong = s.punong_barangay || o['Punong Barangay'] || ''
  return {
    province: s.province || '',
    localityType: s.locality_type || 'City',
    locality: s.locality || '',
    barangay: s.barangay || '',
    punongBarangay: punong,
    signer: punong,
    luponSecretary: o['Lupon Secretary'] || '',
    barangaySecretary: o['Barangay Secretary'] || '',
  }
}

function caseFields(c = {}) {
  return {
    complainant: c.complainant_name || '',
    respondent: c.respondent_name || '',
    respondentAddress: c.respondent_address || '',
    caseNo: c.reference_number || '',
    forWhat: c.category || '',
    issueDate: '',
  }
}

function hearingFields(c = {}) {
  const t = timeParts(c.hearing_time)
  return { hearingDate: manilaDate(c.hearing_date), hearingTime: t.clock, hearingPeriod: t.period }
}

const base = (c, s) => ({ ...barangayFields(s), ...caseFields(c || {}) })

export function defaults7(c, s) {
  return {
    ...base(c, s),
    narrative: c?.description || '',
    relief: c?.relief_requested || '',
    madeDate: manilaDate(c?.created_at),
    filedDate: manilaDate(c?.reviewed_at || c?.created_at),
  }
}

export function defaults9(c, s) {
  return {
    ...base(c, s),
    ...hearingFields(c || {}),
    servedDate1: '',
    servedDate2: '',
    servedName2: '',
    leftWith1: '',
    leftWith2: '',
  }
}

export const withHearing = (c, s) => ({ ...base(c, s), ...hearingFields(c || {}) })

export const plain = (c, s) => base(c, s)

export function settlementDefaults(c, s) {
  return { ...base(c, s), terms: c?.settlement_terms || '' }
}

export function repudiationDefaults(c, s) {
  const reason = c?.cfa_reason || ''
  const by = /\(Repudiated by: (.+)\)/.exec(reason)?.[1] || ''
  return { ...base(c, s), repudiatedBy: by, repudiationGround: reason.replace(/\s*\(Repudiated by: .+\)$/, '') }
}
