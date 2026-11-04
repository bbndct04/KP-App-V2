import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (typeof window !== 'undefined' && /error_code=/.test(window.location.hash)) {
  const params = new URLSearchParams(window.location.hash.slice(1))
  try {
    sessionStorage.setItem('kp-auth-error', params.get('error_code') || 'error')
  } catch {
    /* storage unavailable */
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)