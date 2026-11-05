import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase, isOffline, storedSession } from '../lib/supabaseClient'

const AuthContext = createContext(null)
const PROFILE_KEY = 'kp-profile-cache'

function cachedProfile(userId) {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY))
    return p?.id === userId ? p : null
  } catch {
    return null
  }
}

function saveProfile(profile) {
  try {
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    else localStorage.removeItem(PROFILE_KEY)
  } catch {
    /* storage unavailable */
  }
}

async function loadProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (data) saveProfile(data)
  return data || cachedProfile(userId)
}

function offlineState() {
  const saved = isOffline() ? storedSession() : null
  return saved?.user ? { user: saved.user, profile: cachedProfile(saved.user.id), loading: false } : null
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => offlineState() || { user: null, profile: null, loading: true })

  useEffect(() => {
    let active = true
    const reconnect = () => supabase.auth.getSession()
    window.addEventListener('online', reconnect)

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null

      if (!nextUser) {
        const saved = offlineState()
        if (saved) return setState(saved)
        setState({ user: null, profile: null, loading: false })
        return
      }
      if (event === 'TOKEN_REFRESHED') {
        setState((s) => ({ ...s, user: nextUser }))
        return
      }

      // Supabase deadlocks if another client call is awaited inside this callback.
      setTimeout(async () => {
        const profile = await loadProfile(nextUser.id)
        if (active) setState({ user: nextUser, profile, loading: false })
      }, 0)
    })

    return () => {
      active = false
      window.removeEventListener('online', reconnect)
      listener.subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!state.user) return
    const profile = await loadProfile(state.user.id)
    setState((s) => ({ ...s, profile }))
  }, [state.user])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    saveProfile(null)
    setState({ user: null, profile: null, loading: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
