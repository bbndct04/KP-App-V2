import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { isOfficial } from '../lib/accounts'
import TL from './tl'

const KEY = 'kp-lang'
const LanguageContext = createContext({ lang: 'en', setLanguage: () => {}, t: (s) => s })

function readLocal() {
  try {
    return localStorage.getItem(KEY) === 'tl' ? 'tl' : 'en'
  } catch {
    return 'en'
  }
}

function fill(text, vars) {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m))
}

export function LanguageProvider({ children }) {
  const { user, profile, refreshProfile } = useAuth()
  const [chosen, setChosen] = useState(null)
  const official = profile && isOfficial(profile.role)
  const lang = official ? 'en' : chosen || profile?.language || readLocal()

  useEffect(() => {
    document.documentElement.lang = lang === 'tl' ? 'fil' : 'en'
  }, [lang])

  const setLanguage = useCallback(
    async (next) => {
      setChosen(next)
      try {
        localStorage.setItem(KEY, next)
      } catch {
        /* storage unavailable */
      }
      if (user) {
        await supabase.from('profiles').update({ language: next }).eq('id', user.id)
        refreshProfile()
      }
    },
    [user, refreshProfile]
  )

  const t = useCallback((text, vars) => fill(lang === 'tl' ? TL[text] ?? text : text, vars), [lang])
  const value = useMemo(() => ({ lang, setLanguage, t }), [lang, setLanguage, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useT() {
  return useContext(LanguageContext)
}
