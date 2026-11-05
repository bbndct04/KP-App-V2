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

const client = createClient(supabaseUrl, supabaseAnonKey)
const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`

export const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false

export function storedSession() {
  try {
    return JSON.parse(localStorage.getItem(storageKey))
  } catch {
    return null
  }
}

// Offline, the main client waits ~30s trying to renew an expired login before every request.
// This client skips that and sends the saved token, so the service worker answers from its cache at once.
let offline = { token: undefined, client: null }
function offlineClient() {
  const token = storedSession()?.access_token || null
  if (offline.client && offline.token === token) return offline.client
  offline = {
    token,
    client: createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'kp-offline' },
      global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    }),
  }
  return offline.client
}

export const supabase = new Proxy(client, {
  get(target, prop) {
    if ((prop === 'from' || prop === 'rpc') && isOffline()) {
      const c = offlineClient()
      return c[prop].bind(c)
    }
    const value = Reflect.get(target, prop)
    return typeof value === 'function' ? value.bind(target) : value
  },
})