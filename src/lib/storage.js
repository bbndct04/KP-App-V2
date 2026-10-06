import { supabase } from './supabaseClient'

export async function signedUrl(bucket, path, seconds = 600) {
  if (!path) return null
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, seconds)
  return error ? null : data?.signedUrl || null
}
