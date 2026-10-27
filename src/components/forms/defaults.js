import { manilaDate, timeParts } from '../../lib/formsKit'

function barangayFields(s = {}) {
  return {
    province: s.province || '',
    localityType: s.locality_type || 'City',
    locality: s.locality || '',
    barangay: s.barangay || '',
    punongBarangay: s.punong_barangay || '',
  }
}

function caseFields(c = {}) {
  return {
    complainant: c.complainant_name || '',
    respondent: c.respondent_name || '',
    caseNo: c.reference_number || '',
    forWhat: c.category || '',
  }
}

export function defaults7(c, s) {
  return {
    ...barangayFields(s),
    ...caseFields(c),
    narrative: c?.description || '',
    relief: c?.relief_requested || '',
    madeDate: manilaDate(c?.created_at),
    filedDate: manilaDate(c?.reviewed_at || c?.created_at),
  }
}

export function defaults9(c, s) {
  const t = timeParts(c?.hearing_time)
  return {
    ...barangayFields(s),
    ...caseFields(c),
    respondentAddress: c?.respondent_address || '',
    hearingDate: manilaDate(c?.hearing_date),
    hearingTime: t.clock,
    hearingPeriod: t.period,
    issueDate: '',
    servedDate1: '',
    servedDate2: '',
    servedName2: '',
    leftWith1: '',
    leftWith2: '',
  }
}
