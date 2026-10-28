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
} from 'react-icons/md'

export const STATUS = {
  submitted: { hint: 'Visit the barangay hall within 24 hours', label: 'Awaiting Review', icon: MdOutlinePendingActions, className: 'bg-warning-soft text-warning-strong' },
  filed: { hint: 'Accepted · summons will be issued soon', label: 'Filed', icon: MdOutlineInbox, className: 'bg-warning-soft text-warning-strong' },
  summoned: { hint: 'The other party has been summoned', label: 'Summoned', icon: MdOutlineMarkEmailRead, className: 'bg-info-soft text-info-strong' },
  mediation: { hint: 'In mediation with the Punong Barangay', label: 'Mediation', icon: MdOutlineHandshake, className: 'bg-accent-soft text-accent' },
  pangkat_formed: { hint: 'A Pangkat will hear your case', label: 'Pangkat Formed', icon: MdOutlineGroups, className: 'bg-purple-soft text-purple-strong' },
  pangkat_hearing: { hint: 'Pangkat hearing in progress', label: 'Pangkat Hearing', icon: MdOutlineGavel, className: 'bg-purple-soft text-purple-strong' },
  settled: { hint: 'Case settled', label: 'Settled', icon: MdOutlineCheckCircle, className: 'bg-success-soft text-success-strong' },
  cfa_issued: { hint: 'You may now file in court', label: 'CFA Issued', icon: MdOutlineDescription, className: 'bg-neutral-soft text-neutral-strong' },
  dismissed: { hint: 'Case dismissed', label: 'Dismissed', icon: MdOutlineCancel, className: 'bg-danger-soft text-danger-strong' },
  declined: { hint: 'Not accepted · see the reason', label: 'Declined', icon: MdOutlineBlock, className: 'bg-danger-soft text-danger-strong' },
}

export const INTAKE_STATUSES = ['submitted', 'declined']
export const ACTIVE_STAGES = ['filed', 'summoned', 'mediation', 'pangkat_formed', 'pangkat_hearing']
export const CLOSED_STAGES = ['settled', 'cfa_issued', 'dismissed']
