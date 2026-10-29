import { Navigate } from 'react-router-dom'
import { MdOutlineBlock } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import { accountState, blockedMessage } from '../lib/accounts'
import AppSkeleton from './AppSkeleton'
import AuthBackground from './AuthBackground'

function BlockedScreen({ profile, onSignOut }) {
  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-10 overflow-hidden">
      <AuthBackground />
      <div className="w-full max-w-md relative z-10 bg-surface rounded-3xl shadow-token-lg p-8 border border-border text-center fade-up">
        <div className="w-16 h-16 bg-danger-soft rounded-full flex items-center justify-center mx-auto mb-4">
          <MdOutlineBlock className="text-3xl text-danger-strong" aria-hidden="true" />
        </div>
        <h1 className="text-ink text-xl font-semibold mb-2">Account blocked</h1>
        <p className="text-ink-soft text-sm leading-relaxed mb-6">{blockedMessage(profile)}</p>
        <button
          onClick={onSignOut}
          className="w-full bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-sm rounded-xl py-3 shadow-token-md"
        >
          Log out
        </button>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) {
    return <AppSkeleton />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (accountState(profile) === 'blocked') {
    return <BlockedScreen profile={profile} onSignOut={signOut} />
  }

  return children
}

export default ProtectedRoute
