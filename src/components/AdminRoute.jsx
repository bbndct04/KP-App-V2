import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppSkeleton from './AppSkeleton'

function AdminRoute({ children }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return <AppSkeleton />
  }

  if (!profile || !['admin', 'staff'].includes(profile.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default AdminRoute