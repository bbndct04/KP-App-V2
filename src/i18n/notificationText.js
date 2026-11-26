import TL from './tl'

const STAGE = {
  'The respondent has been summoned. A hearing will follow.': 'Napadalhan na ng Summons ang respondent. Susunod na ang hearing.',
  'Your case has moved to mediation before the Punong Barangay.': 'Nasa Mediation na ang iyong kaso sa harap ng Punong Barangay.',
  'A Pangkat ng Tagapagkasundo will be formed to conciliate your case.': 'Bubuo ng Pangkat ng Tagapagkasundo para sa Conciliation ng iyong kaso.',
  'A Pangkat has been formed to conciliate your case.': 'Nabuo na ang Pangkat para sa Conciliation ng iyong kaso.',
  'The Pangkat is now hearing your case to help both sides reach a settlement.': 'Dinidinig na ng Pangkat ang iyong kaso para matulungan ang magkabilang panig na magkasundo.',
  'A Pangkat hearing has been scheduled for your case.': 'May naka-schedule nang Pangkat hearing para sa iyong kaso.',
  'Both parties agreed to arbitration. The arbitrator will decide the dispute after hearing both sides.':
    'Pumayag ang magkabilang panig sa Arbitration. Ang arbitrator ang magpapasya pagkatapos marinig ang dalawang panig.',
  'Your case has been settled.': 'Naayos na ang iyong kaso.',
  'The settlement was not complied with. The barangay will enforce it through execution.': 'Hindi natupad ang settlement. Ipapatupad ito ng barangay sa pamamagitan ng Execution.',
  'The settlement has been complied with. Your case is now closed.': 'Natupad na ang settlement. Sarado na ang iyong kaso.',
  'A Certificate to File Action has been issued. You may now bring the case to court or the proper government office.':
    'Naglabas na ng Certificate to File Action. Puwede mo nang dalhin ang kaso sa korte o sa tamang government office.',
  'A Certificate to File Action has been issued for your case.': 'Naglabas na ng Certificate to File Action para sa iyong kaso.',
  'Your case has been dismissed.': 'Na-dismiss na ang iyong kaso.',
}

const PATTERNS = [
  [
    /^Your complaint \(Ref: (.+?)\) was submitted and is waiting for the barangay to review it\. You'll be notified once it is accepted\.$/s,
    (ref) => `Naipadala ang iyong complaint (Ref: ${ref}) at hinihintay ang review ng barangay. Aabisuhan ka kapag na-accept na ito.`,
  ],
  [
    /^Your complaint \(Ref: (.+?)\) was accepted and filed by the barangay\. You will be notified when a summons is issued\.$/s,
    (ref) => `Na-accept at na-file na ng barangay ang iyong complaint (Ref: ${ref}). Aabisuhan ka kapag naipadala na ang Summons.`,
  ],
  [
    /^Your complaint \(Ref: (.+?)\) was not accepted\. Reason: (.*)\. You may visit the barangay hall or submit a new complaint\.$/s,
    (ref, reason) => `Hindi na-accept ang iyong complaint (Ref: ${ref}). Dahilan: ${TL[reason] ?? reason}. Puwede kang pumunta sa Barangay Hall o mag-file ng bagong complaint.`,
  ],
  [
    /^Your hearing for case (.+?) is scheduled for tomorrow(?: at (.+?))?\. Please be prepared to attend\.$/s,
    (ref, time) => `Bukas na ang hearing ng iyong kaso ${ref}${time ? `, ${time}` : ''}. Maghanda po at dumalo.`,
  ],
  [
    /^You cannot file new complaints(?: until (.+?))?\. Reason: (.*)\. You can still view your existing cases\. Visit the Barangay Hall if you have questions\.$/s,
    (until, reason) =>
      `Hindi ka muna makakapag-file ng bagong complaint${until ? ` hanggang ${until}` : ''}. Dahilan: ${reason}. Makikita mo pa rin ang iyong mga kaso. Pumunta sa Barangay Hall kung may tanong ka.`,
  ],
  [
    /^Your complaint \(Ref: (.+?)\) was filed at the barangay hall\. You will be notified when a summons is issued\.$/s,
    (ref) => `Na-file sa Barangay Hall ang iyong complaint (Ref: ${ref}). Aabisuhan ka kapag naipadala na ang Summons.`,
  ],
  [
    /^You cannot file complaints online(?: until (.+?))?\. Reason: (.*)\. You can still file a complaint in person at the Barangay Hall and view your existing cases\.$/s,
    (until, reason) =>
      `Hindi ka muna makakapag-file ng complaint online${until ? ` hanggang ${until}` : ''}. Dahilan: ${reason}. Puwede ka pa ring mag-file nang personal sa Barangay Hall at makita ang iyong mga kaso.`,
  ],
  [
    /^Your complaint \(Ref: (.+?)\) needs to be confirmed in person\. Please visit the Barangay Hall by (.+?), 5:00 PM and bring a valid ID\. Reason: (.*)\.$/s,
    (ref, date, reason) =>
      `Kailangang personal na kumpirmahin ang iyong complaint (Ref: ${ref}). Pumunta po sa Barangay Hall bago ang ${date}, 5:00 PM at magdala ng valid ID. Dahilan: ${TL[reason] ?? reason}.`,
  ],
  [
    /^Your complaint \(Ref: (.+?)\) was not confirmed in person by the deadline\. It is kept on record\. You may still visit the Barangay Hall to continue it\.$/s,
    (ref) => `Hindi nakumpirma nang personal ang iyong complaint (Ref: ${ref}) bago ang deadline. Nakatala pa rin ito. Puwede ka pa ring pumunta sa Barangay Hall para ituloy ito.`,
  ],
  [/^Your account has been restored\. You can file complaints again\.$/, () => 'Naibalik na ang iyong account. Puwede ka nang mag-file ulit ng complaint.'],
]

function stageMessage(message) {
  const m = message.match(/^(.*?)(?: Hearing: (.+?)\.)? \(Ref: ([^)]+)\)$/s)
  if (!m) return null
  const [, base, hearing, ref] = m
  const settled = base.match(/^A settlement was reached\. It becomes final on (.+?) unless repudiated within 10 days\.$/s)
  const text = settled
    ? `Nagkaroon ng settlement. Magiging final ito sa ${settled[1]} maliban kung i-repudiate sa loob ng 10 araw.`
    : STAGE[base]
  if (!text) return null
  return `${text}${hearing ? ` Hearing: ${hearing}.` : ''} (Ref: ${ref})`
}

export function translateNotification(message, lang) {
  if (lang !== 'tl' || !message) return message
  for (const [re, fn] of PATTERNS) {
    const m = message.match(re)
    if (m) return fn(...m.slice(1))
  }
  return stageMessage(message) || message
}

const ADMIN = [
  [
    /^Case (.+?) \((.+?)\) was filed by (.+?)\. Review it in New Complaints\.$/s,
    (ref, cat, who) => `Na-file ni ${who === 'a resident' ? 'isang residente' : who} ang case ${ref} (${TL[cat] ?? cat}). I-review ito sa New Complaints.`,
  ],
  [
    /^Case (.+?) \((.+?)\) was filed by (.+?)\. The complainant should appear at the barangay hall within 24 hours\.$/s,
    (ref, cat, who) => `Na-file ni ${who === 'a resident' ? 'isang residente' : who} ang case ${ref} (${TL[cat] ?? cat}). Dapat pumunta ang complainant sa Barangay Hall sa loob ng 24 oras.`,
  ],
  [
    /^You have (\d+) hearings? scheduled today: (.+)\.$/s,
    (n, refs) => `May ${n} hearing ka ngayong araw: ${refs}.`,
  ],
  [
    /^Complaint (.+?) has been waiting for review for over a day\.(?: The respondent should be summoned by the next working day after a complaint is received\.)?$/s,
    (ref) => `Mahigit isang araw nang naghihintay ng review ang complaint ${ref}. Dapat ma-summon ang respondent sa susunod na working day.`,
  ],
  [/^Case (.+?) has been in "Filed" for over 3 days with no summons issued\.$/s, (ref) => `Mahigit 3 araw nang naka-"Filed" ang case ${ref} at wala pang Summons.`],
  [/^Case (.+?) has exceeded the 15-day mediation period\. Consider forming a Pangkat\.$/s, (ref) => `Lampas na sa 15-day Mediation period ang case ${ref}. Pag-isipang bumuo ng Pangkat.`],
  [
    /^Case (.+?) has reached the 15-day Pangkat period\. An extension of up to 15 days may be granted\.$/s,
    (ref) => `Umabot na sa 15-day Pangkat period ang case ${ref}. Puwedeng magbigay ng extension hanggang 15 araw.`,
  ],
  [
    /^Complaint (.+?) was not confirmed in person by the deadline\. It is kept on record as not confirmed\.$/s,
    (ref) => `Hindi nakumpirma nang personal ang complaint ${ref} bago ang deadline. Nakatala ito bilang hindi kumpirmado.`,
  ],
  [
    /^Complaint (.+?) was filed by an account flagged as high risk\. Check the warning signs before accepting it\.$/s,
    (ref) => `Ang complaint ${ref} ay na-file ng account na may mataas na risk. Tingnan ang mga babala bago ito i-accept.`,
  ],
  [
    /^The new account of (.+?) has the same ID, contact number, or name and birthdate as another account\. Check it in Manage Users\.$/s,
    (name) => `Ang bagong account ni ${name} ay may parehong ID, contact number, o pangalan at birthdate sa ibang account. Tingnan ito sa Mga User.`,
  ],
  [/^(.+?) viewed the IDs of (\d+) residents within one hour\.$/s, (who, n) => `Tiningnan ni ${who} ang ID ng ${n} residente sa loob ng isang oras.`],
  [/^(.+?) declined (\d+) complaints within one hour\.$/s, (who, n) => `Hindi nag-accept si ${who} ng ${n} complaint sa loob ng isang oras.`],
  [/^(.+?) gave admin access to (.+?)\.$/s, (who, to) => `Binigyan ni ${who} ng admin access si ${to}.`],
  [/^Case (.+?) has exceeded the maximum 30-day Pangkat period\.$/s, (ref) => `Lampas na sa maximum na 30-day Pangkat period ang case ${ref}.`],
  [
    /^Case (.+?) has been in arbitration for over 15 days\. The award should be issued\.$/s,
    (ref) => `Mahigit 15 araw nang nasa Arbitration ang case ${ref}. Dapat nang i-issue ang award.`,
  ],
  [
    /^The 10-day repudiation period for case (.+?) has ended\. Record whether the settlement was complied with\.$/s,
    (ref) => `Tapos na ang 10-day repudiation period ng case ${ref}. I-record kung natupad ang settlement.`,
  ],
  [
    /^Case (.+?) must be executed within 6 months of the settlement\. Less than 30 days remain\.$/s,
    (ref) => `Dapat ma-execute ang case ${ref} sa loob ng 6 na buwan mula sa settlement. Wala nang 30 araw ang natitira.`,
  ],
  [
    /^The 6-month execution period for case (.+?) has passed\. The settlement can now only be enforced in court\.$/s,
    (ref) => `Lumipas na ang 6-month execution period ng case ${ref}. Sa korte na lang puwedeng ipatupad ang settlement.`,
  ],
]

export function translateAdminNotification(message, lang) {
  if (lang !== 'tl' || !message) return message
  for (const [re, fn] of ADMIN) {
    const m = message.match(re)
    if (m) return fn(...m.slice(1))
  }
  return translateNotification(message, lang)
}
