import {
  MdOutlineInbox,
  MdOutlineMarkEmailRead,
  MdOutlineHandshake,
  MdOutlineGroups,
  MdOutlineGavel,
  MdOutlineCheckCircle,
  MdOutlineDescription,
  MdOutlineCancel,
} from 'react-icons/md'

export const STATUS = {
  filed: { label: 'Filed', icon: MdOutlineInbox, className: 'bg-warning-soft text-warning-strong' },
  summoned: { label: 'Summoned', icon: MdOutlineMarkEmailRead, className: 'bg-info-soft text-info-strong' },
  mediation: { label: 'Mediation', icon: MdOutlineHandshake, className: 'bg-accent-soft text-accent' },
  pangkat_formed: { label: 'Pangkat Formed', icon: MdOutlineGroups, className: 'bg-purple-soft text-purple-strong' },
  pangkat_hearing: { label: 'Pangkat Hearing', icon: MdOutlineGavel, className: 'bg-purple-soft text-purple-strong' },
  settled: { label: 'Settled', icon: MdOutlineCheckCircle, className: 'bg-success-soft text-success-strong' },
  cfa_issued: { label: 'CFA Issued', icon: MdOutlineDescription, className: 'bg-neutral-soft text-neutral-strong' },
  dismissed: { label: 'Dismissed', icon: MdOutlineCancel, className: 'bg-danger-soft text-danger-strong' },
}
