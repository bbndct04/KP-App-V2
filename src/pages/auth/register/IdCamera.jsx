import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MdClose, MdOutlineNoPhotography } from 'react-icons/md'

const CARD = 1.586
const GUIDE_W = 0.86
const GUIDE_H = 0.7

function guideSize(w, h) {
  const gw = Math.min(w * GUIDE_W, h * GUIDE_H * CARD)
  return { w: gw, h: gw / CARD }
}

function IdCamera({ side, onCapture, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState('')
  const [live, setLive] = useState(false)
  const areaRef = useRef(null)
  const [area, setArea] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setArea({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop())
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch((err) =>
        setError(
          err?.name === 'NotAllowedError'
            ? 'Camera access was blocked. Allow camera access for this site, or close this and upload a photo instead.'
            : 'No camera was found. Close this and upload a photo of your ID instead.'
        )
      )
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function shoot() {
    const v = videoRef.current
    if (!v?.videoWidth) return
    const box = v.getBoundingClientRect()
    const scale = Math.max(box.width / v.videoWidth, box.height / v.videoHeight)
    const shownW = box.width / scale
    const shownH = box.height / scale
    const offX = (v.videoWidth - shownW) / 2
    const offY = (v.videoHeight - shownH) / 2
    const g = guideSize(box.width, box.height)
    const gw = g.w / scale
    const gh = g.h / scale
    const sx = offX + (shownW - gw) / 2
    const sy = offY + (shownH - gh) / 2
    const pad = 0.04
    const canvas = document.createElement('canvas')
    canvas.width = 1400
    canvas.height = Math.round(1400 / CARD)
    canvas
      .getContext('2d')
      .drawImage(v, sx - gw * pad, sy - gh * pad, gw * (1 + 2 * pad), gh * (1 + 2 * pad), 0, 0, canvas.width, canvas.height)
    onCapture(canvas.toDataURL('image/jpeg', 0.85))
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-black flex flex-col" role="dialog" aria-modal="true" aria-label={`Take a photo of the ${side} of your ID`}>
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="text-base font-semibold">{side === 'back' ? 'Back of your ID' : 'Front of your ID'}</div>
        <button type="button" onClick={onClose} aria-label="Close camera" className="p-2 -mr-2">
          <MdClose className="text-2xl" aria-hidden="true" />
        </button>
      </div>

      <div ref={areaRef} className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white/90 px-8">
            <MdOutlineNoPhotography className="text-5xl mb-3" aria-hidden="true" />
            <p className="text-sm max-w-[320px]">{error}</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted onLoadedData={() => setLive(true)} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="relative rounded-2xl border-2 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                style={guideSize(area.w, area.h)}
              >
                <span className="absolute -top-px -left-px w-7 h-7 border-t-4 border-l-4 border-white rounded-tl-2xl" />
                <span className="absolute -top-px -right-px w-7 h-7 border-t-4 border-r-4 border-white rounded-tr-2xl" />
                <span className="absolute -bottom-px -left-px w-7 h-7 border-b-4 border-l-4 border-white rounded-bl-2xl" />
                <span className="absolute -bottom-px -right-px w-7 h-7 border-b-4 border-r-4 border-white rounded-br-2xl" />
              </div>
            </div>
            <div className="absolute top-4 inset-x-4 text-center">
              <span className="inline-block bg-white/95 text-slate-900 text-sm font-semibold px-3.5 py-1.5 rounded-full">
                Fit the {side === 'back' ? 'back' : 'front'} of your ID inside the frame
              </span>
            </div>
            <div className="absolute bottom-4 inset-x-4 text-center text-white/85 text-xs">Flat surface · Good light · No glare or fingers on the card</div>
          </>
        )}
      </div>

      <div className="py-6 flex justify-center bg-black">
        <button
          type="button"
          onClick={shoot}
          disabled={!live || !!error}
          aria-label="Take photo"
          className="w-[72px] h-[72px] rounded-full bg-white ring-4 ring-white/30 disabled:opacity-40 active:scale-95 transition-transform"
        />
      </div>
    </div>,
    document.body
  )
}

export default IdCamera
