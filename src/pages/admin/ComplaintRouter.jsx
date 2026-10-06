import { useEffect, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import AdminLayout from '../../components/layout/AdminLayout'
import { Skeleton } from '../../components/ui'
import { INTAKE_STATUSES } from '../../components/status'
import ReviewComplaint from './ReviewComplaint'
import CaseDetail from './CaseDetail'

// One link works for every complaint: new ones open the review screen, accepted ones open the case.
function ComplaintRouter() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const key = `${id}|${pathname}`
  const [result, setResult] = useState({ key: null, status: null })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase.from('complaints').select('status').eq('id', id).maybeSingle()
      if (!cancelled) setResult({ key, status: data?.status || 'missing' })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, key])

  if (result.key !== key) {
    return (
      <AdminLayout title="Loading">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-20 w-2/3" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </AdminLayout>
    )
  }

  const intake = INTAKE_STATUSES.includes(result.status)
  const onCasesPath = pathname.startsWith('/admin/cases/')

  if (result.status !== 'missing') {
    if (intake && onCasesPath) return <Navigate to={`/admin/complaints/${id}`} replace />
    if (!intake && !onCasesPath) return <Navigate to={`/admin/cases/${id}`} replace />
  }

  return intake ? <ReviewComplaint /> : <CaseDetail />
}

export default ComplaintRouter
