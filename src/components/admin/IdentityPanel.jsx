import { useEffect, useState } from 'react'
import {
  MdOutlineLockPerson,
  MdOutlineVerifiedUser,
  MdOutlineImageNotSupported,
  MdOutlineZoomIn,
  MdExpandMore,
  MdExpandLess,
} from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { signedUrl } from '../../lib/storage'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/toastContext'
import { Card, CardHeader, Button, Skeleton } from '../ui'
import Lightbox from './Lightbox'

function Tile({ label, url, onZoom }) {
  return (
    <div>
      <div className="text-xs text-ink-faint uppercase tracking-wide mb-1.5">{label}</div>
      {url ? (
        <button
          onClick={() => onZoom({ url, label })}
          aria-label={`View ${label} full size`}
          className="relative block w-full aspect-[4/3] rounded-xl overflow-hidden border border-border bg-surface-sunken"
        >
          <img src={url} alt={label} className="w-full h-full object-contain" />
          <span className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-1.5">
            <MdOutlineZoomIn className="text-lg" aria-hidden="true" />
          </span>
        </button>
      ) : (
        <div className="w-full aspect-[4/3] rounded-xl border border-dashed border-border bg-surface-sunken flex flex-col items-center justify-center text-ink-faint text-sm gap-1">
          <MdOutlineImageNotSupported className="text-3xl" aria-hidden="true" />
          Not uploaded
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border last:border-0 text-sm">
      <span className="text-ink-faint flex-shrink-0">{label}</span>
      <span className="text-ink text-right">{value}</span>
    </div>
  )
}

function IdentityPanel({ userId, collapsible = false, defaultOpen = true, className = '' }) {
  const { user, profile: adminProfile } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(defaultOpen)
  const [data, setData] = useState({ key: null })
  const [zoom, setZoom] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !userId) return
    let cancelled = false
    async function load() {
      const [{ data: profile }, { data: verification }, selfie, id] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('identity_verifications').select('*').eq('user_id', userId).maybeSingle(),
        signedUrl('face-uploads', `${userId}/face.jpg`),
        signedUrl('id-uploads', `${userId}/id.jpg`),
      ])
      if (!cancelled) setData({ key: userId, profile, verification, selfie, id })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [open, userId])

  const ready = data.key === userId
  const { profile, verification } = ready ? data : {}

  async function markVerified() {
    setSaving(true)
    const row = { user_id: userId, verified_by: user.id, verified_by_name: adminProfile?.full_name || 'a barangay admin' }
    const { data: saved, error } = await supabase.from('identity_verifications').insert(row).select().maybeSingle()
    setSaving(false)
    if (error) {
      toast.error(`Could not save the verification. ${error.message}`)
      return
    }
    setData((d) => ({ ...d, verification: saved || { ...row, verified_at: new Date().toISOString() } }))
    toast.success('Identity marked as verified.')
  }

  async function undoVerified() {
    setSaving(true)
    const { error } = await supabase.from('identity_verifications').delete().eq('user_id', userId)
    setSaving(false)
    if (error) {
      toast.error(`Could not remove the verification. ${error.message}`)
      return
    }
    setData((d) => ({ ...d, verification: null }))
    toast.success('Verification removed.')
  }

  return (
    <Card className={className}>
      <CardHeader
        icon={MdOutlineLockPerson}
        title="Complainant identity"
        subtitle="Confidential — for identity verification only"
        action={
          collapsible ? (
            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="text-accent text-sm font-semibold flex items-center gap-1 flex-shrink-0"
            >
              {open ? 'Hide' : 'Show'} {open ? <MdExpandLess aria-hidden="true" /> : <MdExpandMore aria-hidden="true" />}
            </button>
          ) : null
        }
      />
      {open && (
        <div className="p-5">
          {!ready ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <Tile label="Selfie" url={data.selfie} onZoom={setZoom} />
                <Tile label="Government ID" url={data.id} onZoom={setZoom} />
              </div>

              {!data.selfie && !data.id && (
                <div className="bg-warning-soft border border-warning-strong/20 text-warning-strong text-sm rounded-lg p-3 mb-4 leading-relaxed">
                  This resident has no ID or selfie on file. Ask them to bring a valid ID when they appear at the barangay hall.
                </div>
              )}

              <div className="mb-5">
                <div className="text-xs text-ink-faint uppercase tracking-wide mb-1">Registered account</div>
                <Row label="Name" value={profile?.full_name} />
                <Row label="Date of birth" value={profile?.date_of_birth && new Date(`${profile.date_of_birth}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
                <Row label="Sex" value={profile?.sex} />
                <Row label="Contact" value={profile?.contact_number} />
                <Row label="Address" value={profile?.address} />
              </div>

              {verification ? (
                <div className="bg-success-soft border border-success-strong/20 rounded-lg p-3.5 flex items-start gap-2.5">
                  <MdOutlineVerifiedUser className="text-2xl text-success-strong flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1 text-sm text-success-strong">
                    <div className="font-semibold">Identity verified</div>
                    <div>
                      by {verification.verified_by_name || 'a barangay admin'} on{' '}
                      {new Date(verification.verified_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <button onClick={undoVerified} disabled={saving} className="underline font-semibold mt-1 disabled:opacity-50">
                      Undo
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <Button onClick={markVerified} disabled={saving} variant="secondary" icon={MdOutlineVerifiedUser} className="w-full">
                    {saving ? 'Saving...' : 'Mark identity as verified'}
                  </Button>
                  <div className="text-ink-faint text-xs mt-2 leading-relaxed">
                    Compare the selfie with the photo on the ID, and check that the name matches the registered account.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {zoom && <Lightbox src={zoom.url} alt={zoom.label} onClose={() => setZoom(null)} />}
    </Card>
  )
}

export default IdentityPanel
