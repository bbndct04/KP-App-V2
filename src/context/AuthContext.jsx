import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

async function loadProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  return data
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, profile: null, loading: true })

  useEffect(() => {
    let active = true

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null

      if (!nextUser) {
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
