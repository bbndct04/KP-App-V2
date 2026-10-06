import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppSkeleton from './AppSkeleton'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <AppSkeleton />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute