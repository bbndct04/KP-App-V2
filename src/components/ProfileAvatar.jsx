import { useEffect, useState } from 'react'
import { signedUrl } from '../lib/storage'

const cache = new Map()

function useAvatarUrl(path) {
  const [state, setState] = useState(() => ({ path, url: cache.get(path)?.url || null }))

  useEffect(() => {
    if (!path) return
    const hit = cache.get(path)
    if (hit && hit.expires > Date.now()) return
    let cancelled = false
    signedUrl('avatars', path, 3600).then((url) => {
      if (url) cache.set(path, { url, expires: Date.now() + 3500 * 1000 })
      if (!cancelled) setState({ path, url })
    })
    return () => {
      cancelled = true
    }
  }, [path])

  if (!path) return null
  return state.path === path ? state.url || cache.get(path)?.url || null : cache.get(path)?.url || null
}

function ProfileAvatar({ path, name, className = 'w-9 h-9 text-sm' }) {
  const url = useAvatarUrl(path)
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return url ? (
    <img src={url} alt="" className={`${className} rounded-full object-cover flex-shrink-0 bg-surface-sunken`} />
  ) : (
    <div className={`${className} rounded-full bg-accent flex items-center justify-center text-accent-ink font-bold flex-shrink-0`}>{initials}</div>
  )
}

export default ProfileAvatar
