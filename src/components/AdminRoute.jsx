import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AdminRoute({ children }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-950">
        <div className="text-white font-sans">Loading...</div>
      </div>
    )
  }

  if (!profile || !['admin', 'staff'].includes(profile.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default AdminRoute