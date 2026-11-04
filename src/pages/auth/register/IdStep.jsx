import { useRef, useState } from 'react'
import { MdArrowBack, MdArrowForward, MdOutlineCheckCircle, MdOutlineErrorOutline, MdOutlinePhotoCamera, MdOutlineFileUpload, MdRefresh, MdOutlineInfo } from 'react-icons/md'
import { supabase } from '../../../lib/supabaseClient'
import { compressImage } from '../../../lib/image'
import { ID_TYPES, MAX_ID_ATTEMPTS, idMatches, hasBack } from './constants'
import IdCamera from './IdCamera'

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function readDetails(text) {
  const out = {}
  const name = text.match(/(?:Name|Pangalan)[:\s]+([A-Za-z ,.'-]+)/i)
  if (name?.[1]) {
    const parts = name[1].trim().split(/\s+/)
    if (parts.length >= 2) {
      out.firstName = parts[0]
      out.lastName = parts[parts.length - 1]
    }
  }
  const iso = text.match(/\b(19\d{2}|20\d{2})[/-](\d{2})[/-](\d{2})\b/)
  const mdy = text.match(/\b(\d{2})[/-](\d{2})[/-](\d{4})\b/)
  const named = text.match(new RegExp(`\\b(${MONTHS.join('|')})[a-z]*\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'i'))
  if (named) out.dob = `${named[3]}-${String(MONTHS.indexOf(named[1].slice(0, 3).toLowerCase()) + 1).padStart(2, '0')}-${named[2].padStart(2, '0')}`
  else if (iso) out.dob = `${iso[1]}-${iso[2]}-${iso[3]}`
  else if (mdy) {
    const [a, b] = [Number(mdy[1]), Number(mdy[2])]
    const [m, d] = a > 12 ? [b, a] : [a, b]
    out.dob = `${mdy[3]}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  const sex = text.match(/\b(MALE|FEMALE)\b/i)
  if (sex) out.sex = sex[1].toUpperCase() === 'MALE' ? 'Male' : 'Female'
  const address = text.match(/(?:Address|Tirahan)[:\s]+([^\n]{5,80})/i)
  if (address?.[1]) out.address = address[1].trim()
  return out
}

function Slot({ title, hint, image, disabled, busy, onCamera, onFile, onClear, children }) {
  const fileRef = useRef(null)
  return (
    <div className="border border-border rounded-2xl p-4 bg-surface-sunken">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-ink text-sm font-semibold">{title}</div>
          <div className="text-ink-faint text-xs">{hint}</div>
        </div>
        {image && !busy && (
          <button type="button" onClick={onClear} className="text-accent text-sm font-semibold inline-flex items-center gap-1">
            <MdRefresh aria-hidden="true" /> Retake
          </button>
        )}
      </div>

      {image ? (
        <img src={image} alt={title} className="w-full max-h-[200px] object-contain rounded-xl bg-surface" />
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={disabled}
            onClick={onCamera}
            className="h-[88px] rounded-xl bg-accent text-accent-ink font-semibold text-sm flex flex-col items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <MdOutlinePhotoCamera className="text-2xl" aria-hidden="true" /> Take photo
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileRef.current?.click()}
            className="h-[88px] rounded-xl border-2 border-dashed border-border bg-surface text-ink font-semibold text-sm flex flex-col items-center justify-center gap-1 hover:border-accent/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <MdOutlineFileUpload className="text-2xl text-accent" aria-hidden="true" /> Upload
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) onFile(f)
            }}
          />
        </div>
      )}
      {children}
    </div>
  )
}

function IdStep({ idType, setIdType, idFront, setIdFront, idBack, setIdBack, onScanned, onBack, onNext }) {
  const [status, setStatus] = useState(idFront ? 'ok' : 'idle')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [camera, setCamera] = useState(null)

  const label = ID_TYPES.find((t) => t.value === idType)?.label
  const needsBack = hasBack(idType)
  const ready = status === 'ok' && (!needsBack || !!idBack)

  function chooseType(value) {
    setIdType(value)
    setIdFront(null)
    setIdBack(null)
    setStatus('idle')
    setError('')
  }

  function fail(message) {
    setAttempts((n) => n + 1)
    setStatus('bad')
    setError(message)
  }

  async function checkFront(image) {
    setIdFront(image)
    setStatus('scanning')
    setError('')
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-id', { body: { imageBase64: image } })
      const text = data?.text || ''
      if (fnError || !text) return fail("We couldn't read the text on your ID. Retake it in a brighter place, flat and without glare.")
      if (!idMatches(text, idType)) return fail(`This doesn't look like a ${label}. Use the correct ID, or choose the ID type that matches your card.`)
      onScanned(readDetails(text))
      setStatus('ok')
    } catch {
      fail('Something went wrong while checking your ID. Please try again.')
    }
  }

  async function fromFile(file, side) {
    if (!file.type.startsWith('image/')) return side === 'front' ? fail('Please upload a photo (JPG or PNG) of your ID.') : null
    const image = await compressImage(file, 1600, 0.82)
    if (side === 'front') checkFront(image)
    else setIdBack(image)
  }

  function onCaptured(image) {
    const side = camera
    setCamera(null)
    if (side === 'front') checkFront(image)
    else setIdBack(image)
  }

  return (
    <>
      <div className="mb-5">
        <h2 className="text-ink text-2xl font-bold mb-1">Valid ID</h2>
        <p className="text-ink-soft text-sm">Take a photo of your primary government ID, or upload one.</p>
      </div>

      <div className="mb-4">
        <label htmlFor="id-type" className="block text-sm font-semibold text-ink-soft mb-1.5">
          ID type *
        </label>
        <select
          id="id-type"
          value={idType}
          onChange={(e) => chooseType(e.target.value)}
          className="w-full bg-surface-sunken border border-border text-ink rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="">Choose your ID</option>
          {ID_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <div className="text-xs text-ink-faint mt-1.5 flex gap-1">
          <MdOutlineInfo className="text-sm flex-shrink-0 mt-px" aria-hidden="true" />
          Primary government IDs only. The ID must not be expired.
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Slot
          title={idType === 'passport' ? 'Passport photo page' : 'Front of ID'}
          hint="The side with your photo and name"
          image={idFront}
          disabled={!idType}
          busy={status === 'scanning'}
          onCamera={() => setCamera('front')}
          onFile={(f) => fromFile(f, 'front')}
          onClear={() => {
            setIdFront(null)
            setStatus('idle')
            setError('')
          }}
        >
          {status === 'scanning' && (
            <div role="status" className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium mt-3 bg-info-soft text-info-strong">
              <div className="w-4 h-4 border-2 border-info-strong/30 border-t-info-strong rounded-full animate-spin" />
              Checking your ID...
            </div>
          )}
          {status === 'ok' && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium mt-3 bg-success-soft text-success-strong">
              <MdOutlineCheckCircle className="text-lg flex-shrink-0" aria-hidden="true" /> {label} confirmed
            </div>
          )}
          {status === 'bad' && (
            <div role="alert" className="rounded-lg p-3.5 mt-3 bg-danger-soft border border-danger-strong/25 text-danger-strong text-sm">
              <div className="font-semibold flex items-center gap-1.5 mb-1">
                <MdOutlineErrorOutline className="text-lg flex-shrink-0" aria-hidden="true" /> ID not accepted
              </div>
              <div className="leading-relaxed">{error}</div>
              {attempts >= MAX_ID_ATTEMPTS && (
                <div className="mt-2 text-xs leading-relaxed">Still not working? Visit the Barangay Hall (8AM–5PM, Monday to Friday) and the staff will help you.</div>
              )}
            </div>
          )}
        </Slot>

        {needsBack && (
          <Slot
            title="Back of ID"
            hint="Turn your ID over"
            image={idBack}
            disabled={!idType}
            onCamera={() => setCamera('back')}
            onFile={(f) => fromFile(f, 'back')}
            onClear={() => setIdBack(null)}
          />
        )}
      </div>

      <div className="mt-5 flex justify-between items-center gap-3">
        <button type="button" onClick={onBack} className="border border-border rounded-lg px-5 py-2.5 text-sm text-ink-soft inline-flex items-center gap-1.5">
          <MdArrowBack aria-hidden="true" /> Back
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={onNext}
          className="bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-accent-ink font-semibold text-sm rounded-xl px-7 py-2.5 shadow-token-md inline-flex items-center gap-2"
        >
          Next <MdArrowForward aria-hidden="true" />
        </button>
      </div>

      {camera && <IdCamera side={camera} onCapture={onCaptured} onClose={() => setCamera(null)} />}
    </>
  )
}

export default IdStep
