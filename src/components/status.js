import {
  MdOutlinePendingActions,
  MdOutlineInbox,
  MdOutlineMarkEmailRead,
  MdOutlineHandshake,
  MdOutlineGroups,
  MdOutlineGavel,
  MdOutlineCheckCircle,
  MdOutlineDescription,
  MdOutlineCancel,
  MdOutlineBlock,
  MdOutlineBalance,
  MdOutlineAssignmentLate,
  MdOutlineTaskAlt,
} from 'react-icons/md'

export const STATUS = {
  submitted: { hint: 'Visit the barangay hall within 24 hours', label: 'Awaiting Review', icon: MdOutlinePendingActions, className: 'bg-warning-soft text-warning-strong' },
  filed: { hint: 'Accepted · summons will be issued soon', label: 'Filed', icon: MdOutlineInbox, className: 'bg-warning-soft text-warning-strong' },
  summoned: { hint: 'The other party has been summoned', label: 'Summoned', icon: MdOutlineMarkEmailRead, className: 'bg-info-soft text-info-strong' },
  mediation: { hint: 'In mediation with the Punong Barangay', label: 'Mediation', icon: MdOutlineHandshake, className: 'bg-accent-soft text-accent' },
  pangkat_formed: { hint: 'A Pangkat will hear your case', label: 'Pangkat Formed', icon: MdOutlineGroups, className: 'bg-purple-soft text-purple-strong' },
  pangkat_hearing: { hint: 'Conciliation before the Pangkat', label: 'Conciliation', icon: MdOutlineGavel, className: 'bg-purple-soft text-purple-strong' },
  arbitration: { hint: 'The arbitrator will decide the dispute', label: 'Arbitration', icon: MdOutlineBalance, className: 'bg-info-soft text-info-strong' },
  settled: { hint: 'Settled · final after 10 days', label: 'Settled', icon: MdOutlineCheckCircle, className: 'bg-success-soft text-success-strong' },
  execution: { hint: 'Settlement being enforced', label: 'Execution', icon: MdOutlineAssignmentLate, className: 'bg-warning-soft text-warning-strong' },
  closed: { hint: 'Settlement complied with', label: 'Closed', icon: MdOutlineTaskAlt, className: 'bg-success-soft text-success-strong' },
  cfa_issued: { hint: 'You may now file in court', label: 'CFA Issued', icon: MdOutlineDescription, className: 'bg-neutral-soft text-neutral-strong' },
  dismissed: { hint: 'Case dismissed', label: 'Dismissed', icon: MdOutlineCancel, className: 'bg-danger-soft text-danger-strong' },
  declined: { hint: 'Not accepted · see the reason', label: 'Declined', icon: MdOutlineBlock, className: 'bg-danger-soft text-danger-strong' },
}

export const INTAKE_STATUSES = ['submitted', 'declined']
export const ACTIVE_STAGES = ['filed', 'summoned', 'mediation', 'pangkat_formed', 'pangkat_hearing', 'arbitration', 'settled', 'execution']
export const CLOSED_STAGES = ['closed', 'cfa_issued', 'dismissed']
