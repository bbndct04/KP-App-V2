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
