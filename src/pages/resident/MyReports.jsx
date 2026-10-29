import { useEffect, useState } from 'react'
import { MdOutlineFolderCopy, MdOutlineFilterAltOff, MdAdd } from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'
import { useT } from '../../i18n/LanguageContext'
import { Card, EmptyState, SkeletonRows, LinkButton } from '../../components/ui'
import { CaseRow } from '../../components/cases'
import { ACTIVE_STAGES } from '../../components/status'

const isOpen = (c) => c.status === 'submitted' || ACTIVE_STAGES.includes(c.status)

const FILTERS = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'active', label: 'Active', test: isOpen },
  { key: 'closed', label: 'Closed', test: (c) => !isOpen(c) },
]

function MyReports() {
  const { user } = useAuth()
  const { t } = useT()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    async function loadComplaints() {
      if (!user) return
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setComplaints(data || [])
      setLoading(false)
    }
    loadComplaints()
  }, [user])

  const filter = FILTERS.find((f) => f.key === activeFilter)
  const filtered = complaints.filter(filter.test)

  return (
    <AppLayout title="My Cases">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex gap-2">
          {FILTERS.map((f) => {
            const count = complaints.filter(f.test).length
            const isActive = activeFilter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                aria-pressed={isActive}
                className={`h-10 px-4 rounded-full text-sm font-semibold border transition-colors whitespace-nowrap ${
                  isActive ? 'bg-accent border-accent text-accent-ink' : 'bg-surface border-border text-ink-soft hover:bg-surface-hover'
                }`}
              >
                {t(f.label)}
                {!loading && <span className="ml-1.5 opacity-80">{count}</span>}
              </button>
            )
          })}
        </div>
        <div className="hidden md:block flex-shrink-0">
          <LinkButton to="/complaints/new" icon={MdAdd}>{t('File a Complaint')}</LinkButton>
        </div>
      </div>

      <Card className="overflow-hidden max-w-[860px]">
        {loading ? (
          <SkeletonRows rows={5} />
        ) : filtered.length === 0 ? (
          activeFilter === 'all' ? (
            <EmptyState
              icon={MdOutlineFolderCopy}
              title={t('No complaints yet')}
              message={t('Complaints you file will appear here so you can follow their progress.')}
              action={<LinkButton to="/complaints/new" icon={MdAdd}>{t('File a Complaint')}</LinkButton>}
            />
          ) : (
            <EmptyState icon={MdOutlineFilterAltOff} title={filter.key === 'active' ? t('No active cases') : t('No closed cases')} />
          )
        ) : (
          <ul className="divide-y divide-border stagger">
            {filtered.map((c) => (
              <li key={c.id}>
                <CaseRow complaint={c} to={`/track?ref=${c.reference_number}`} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppLayout>
  )
}

export default MyReports
