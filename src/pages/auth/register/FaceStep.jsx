import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MdArrowBack,
  MdArrowForward,
  MdOutlinePhotoCamera,
  MdOutlineNoPhotography,
  MdOutlineCheckCircle,
  MdOutlineFace,
  MdOutlineLightMode,
  MdOutlineVisibilityOff,
  MdOutlinePhoneIphone,
  MdOutlinePersonOutline,
  MdRefresh,
} from 'react-icons/md'

const ASPECT = 3 / 4
const OVAL = { cx: 0.5, cy: 0.46, rx: 0.34, ry: 0.3 }
const HOLD_FRAMES = 5

const TIPS = [
  { icon: MdOutlineVisibilityOff, text: 'Remove your glasses, cap, hat and face mask' },
  { icon: MdOutlineLightMode, text: 'Go to a bright place with light on your face' },
  { icon: MdOutlinePhoneIphone, text: 'Hold your phone at eye level' },
  { icon: MdOutlinePersonOutline, text: 'Make sure only you are in the frame' },
]

let faceapiPromise = null
function loadFaceApi() {
  faceapiPromise ??= (async () => {
    const faceapi = await import('@vladmandic/face-api/dist/face-api.esm.js')
    await faceapi.tf.ready()
    await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri('/models/face'), faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models/face')])
    return faceapi
  })()
  faceapiPromise.catch(() => {
    faceapiPromise = null
  })
  return faceapiPromise
}

function visibleRect(vw, vh) {
  if (vw / vh > ASPECT) {
    const w = vh * ASPECT
    return { x: (vw - w) / 2, y: 0, w, h: vh }
  }
  const h = vw / ASPECT
  return { x: 0, y: (vh - h) / 2, w: vw, h }
}

function centerOf(points) {
  return points.reduce((a, p) => ({ x: a.x + p.x / points.length, y: a.y + p.y / points.length }), { x: 0, y: 0 })
}

function brightness(video, box, canvas) {
  canvas.width = 24
  canvas.height = 24
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(video, box.x, box.y, box.width, box.height, 0, 0, 24, 24)
  const { data } = ctx.getImageData(0, 0, 24, 24)
  let sum = 0
  for (let i = 0; i < data.length; i += 4) sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  return sum / (data.length / 4)
}

function evaluate(faces, video, probe) {
  if (faces.length === 0) return 'Place your face inside the oval'
  if (faces.length > 1) return 'Only one person should be in the frame'
  const { detection, landmarks } = faces[0]
  const box = detection.box
  const r = visibleRect(video.videoWidth, video.videoHeight)
  const size = box.width / r.w
  const nx = (box.x + box.width / 2 - r.x) / r.w
  const ny = (box.y + box.height / 2 - r.y) / r.h
  if (size < 0.4) return 'Move closer to the camera'
  if (size > 0.78) return 'Move back a little'
  if (Math.abs(nx - OVAL.cx) > 0.1 || Math.abs(ny - OVAL.cy) > 0.11) return 'Center your face in the oval'
  const left = centerOf(landmarks.getLeftEye())
  const right = centerOf(landmarks.getRightEye())
  const nose = landmarks.getNose()[3]
  const yaw = (nose.x - left.x) / (right.x - left.x || 1)
  if (yaw < 0.35 || yaw > 0.65) return 'Look straight at the camera'
  if (brightness(video, box, probe) < 70) return 'Your face is too dark. Find more light'
  return ''
}

function FaceStep({ preview, onCapture, onRetake, onBack, onNext }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const probeRef = useRef(null)
  const goodRef = useRef(0)
  const [phase, setPhase] = useState(preview ? 'done' : 'tips')
  const [cameraError, setCameraError] = useState('')
  const [detector, setDetector] = useState('loading')
  const [hint, setHint] = useState('Starting camera...')
  const [ready, setReady] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    loadFaceApi().catch(() => {})
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const capture = useCallback(() => {
    const video = videoRef.current
    if (!video?.videoWidth) return
    const r = visibleRect(video.videoWidth, video.videoHeight)
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 800
    canvas.getContext('2d').drawImage(video, r.x, r.y, r.w, r.h, 0, 0, 600, 800)
    onCapture(canvas.toDataURL('image/jpeg', 0.85))
    stopCamera()
    setPhase('done')
  }, [onCapture, stopCamera])

  useEffect(() => {
    if (phase !== 'camera') return
    let cancelled = false
    let timer = null

    async function start() {
      setCameraError('')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } }, audio: false })
        if (cancelled) return stream.getTracks().forEach((t) => t.stop())
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (err) {
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera access was blocked. Allow camera access for this site in your browser settings, then tap Try again.'
            : 'No camera was found, or another app is using it. Close other apps that use the camera, then tap Try again.'
        )
        return
      }

      if (!cancelled) setHint('Loading face check...')
      let faceapi = null
      try {
        faceapi = await loadFaceApi()
        if (!cancelled) setDetector('on')
      } catch {
        if (!cancelled) {
          setDetector('off')
          setHint('Fit your face inside the oval, then take the photo')
          setReady(true)
        }
        return
      }

      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
      const tick = async () => {
        const video = videoRef.current
        if (cancelled || !video) return
        if (video.readyState >= 2) {
          const faces = await faceapi.detectAllFaces(video, options).withFaceLandmarks(true)
          if (cancelled) return
          const problem = evaluate(faces, video, probeRef.current)
          goodRef.current = problem ? 0 : goodRef.current + 1
          setReady(!problem)
          setHint(problem || (goodRef.current >= HOLD_FRAMES ? 'Taking photo...' : 'Perfect! Hold still'))
          if (goodRef.current >= HOLD_FRAMES) return capture()
        }
        timer = setTimeout(tick, 200)
      }
      tick()
    }
    start()

    return () => {
      cancelled = true
      clearTimeout(timer)
      stopCamera()
    }
  }, [phase, capture, stopCamera])

  function openCamera() {
    goodRef.current = 0
    setReady(false)
    setHint('Starting camera...')
    setPhase('camera')
  }

  function retake() {
    onRetake()
    setConfirmed(false)
    openCamera()
  }

  const ovalColor = detector === 'off' ? '#ffffff' : ready ? '#22c55e' : '#f8fafc'

  return (
    <>
      <div className="mb-5">
        <h2 className="text-ink text-2xl font-bold mb-1">Face Photo</h2>
        <p className="text-ink-soft text-sm">We take a live photo so the barangay can match your face with your ID.</p>
      </div>

      {phase === 'tips' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-accent-soft text-accent flex items-center justify-center">
              <MdOutlineFace className="text-5xl" aria-hidden="true" />
            </div>
          </div>
          <div className="text-ink font-semibold text-center">Before you start</div>
          <ul className="flex flex-col gap-2.5">
            {TIPS.map((t) => {
              const Icon = t.icon
              return (
                <li key={t.text} className="flex items-center gap-3 bg-surface-sunken border border-border rounded-xl px-4 py-3 text-sm text-ink">
                  <Icon className="text-xl text-accent flex-shrink-0" aria-hidden="true" />
                  {t.text}
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            onClick={openCamera}
            className="bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-sm rounded-xl py-3 shadow-token-md inline-flex items-center justify-center gap-2"
          >
            <MdOutlinePhotoCamera className="text-xl" aria-hidden="true" /> I'm ready, open the camera
          </button>
        </div>
      )}

      {phase === 'camera' && (
        <div className="flex flex-col items-center gap-3">
          {cameraError ? (
            <div className="w-full rounded-2xl bg-surface-sunken border border-border p-8 text-center">
              <MdOutlineNoPhotography className="text-5xl text-ink-faint mx-auto mb-3" aria-hidden="true" />
              <div className="text-[15px] font-bold text-ink mb-1.5">Camera unavailable</div>
              <div className="text-sm text-ink-soft max-w-[340px] mx-auto mb-4">{cameraError}</div>
              <button type="button" onClick={openCamera} className="border border-border rounded-lg px-4 py-2 text-sm font-semibold text-ink inline-flex items-center gap-1.5">
                <MdRefresh aria-hidden="true" /> Try again
              </button>
            </div>
          ) : (
            <>
              <div className="relative w-full max-w-[340px] aspect-[3/4] rounded-3xl overflow-hidden bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                <svg viewBox="0 0 300 400" className="absolute inset-0 w-full h-full" aria-hidden="true">
                  <defs>
                    <mask id="face-hole">
                      <rect width="300" height="400" fill="white" />
                      <ellipse cx={300 * OVAL.cx} cy={400 * OVAL.cy} rx={300 * OVAL.rx} ry={400 * OVAL.ry} fill="black" />
                    </mask>
                  </defs>
                  <rect width="300" height="400" fill="rgba(2,6,23,0.6)" mask="url(#face-hole)" />
                  <ellipse
                    cx={300 * OVAL.cx}
                    cy={400 * OVAL.cy}
                    rx={300 * OVAL.rx}
                    ry={400 * OVAL.ry}
                    fill="none"
                    stroke={ovalColor}
                    strokeWidth="4"
                    strokeDasharray={ready ? '0' : '10 8'}
                    style={{ transition: 'stroke 200ms' }}
                  />
                </svg>
                <div className="absolute top-3 inset-x-3 flex justify-center">
                  <span
                    role="status"
                    aria-live="polite"
                    className={`px-3.5 py-1.5 rounded-full text-sm font-semibold shadow-token-md ${ready ? 'bg-success-strong text-white' : 'bg-white/95 text-slate-900'}`}
                  >
                    {hint}
                  </span>
                </div>
                <div className="absolute bottom-3 inset-x-3 text-center text-white/90 text-xs font-medium">No glasses · Face the camera · Good lighting</div>
              </div>
              <canvas ref={probeRef} className="hidden" />
              {detector === 'off' ? (
                <button
                  type="button"
                  onClick={capture}
                  className="bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-sm rounded-xl px-8 py-3 shadow-token-md inline-flex items-center gap-2"
                >
                  <MdOutlinePhotoCamera className="text-xl" aria-hidden="true" /> Take photo
                </button>
              ) : (
                <p className="text-xs text-ink-faint text-center max-w-[340px]">The photo is taken automatically when your face is centered and close enough.</p>
              )}
            </>
          )}
        </div>
      )}

      {phase === 'done' && preview && (
        <div className="flex flex-col items-center gap-4">
          <img src={preview} alt="Your face photo" className="w-full max-w-[260px] aspect-[3/4] object-cover rounded-3xl scale-x-[-1] border border-border" />
          <div className="text-success-strong text-sm font-semibold flex items-center gap-1.5">
            <MdOutlineCheckCircle className="text-lg" aria-hidden="true" /> Photo taken
          </div>
          <label className="flex items-start gap-2.5 bg-surface-sunken border border-border rounded-xl p-3.5 cursor-pointer w-full">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[var(--accent)] flex-shrink-0" />
            <span className="text-sm text-ink leading-relaxed">My whole face is clear, and I am not wearing glasses, a hat or a face mask.</span>
          </label>
          <button type="button" onClick={retake} className="border border-border rounded-lg px-4 py-2 text-sm font-semibold text-ink-soft inline-flex items-center gap-1.5">
            <MdRefresh aria-hidden="true" /> Retake photo
          </button>
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={() => {
            stopCamera()
            onBack()
          }}
          className="border border-border rounded-lg px-5 py-2.5 text-sm text-ink-soft inline-flex items-center gap-1.5"
        >
          <MdArrowBack aria-hidden="true" /> Back
        </button>
        <button
          type="button"
          disabled={!preview || !confirmed}
          onClick={onNext}
          className="bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-accent-ink font-semibold text-sm rounded-xl px-7 py-2.5 shadow-token-md inline-flex items-center gap-2"
        >
          Next <MdArrowForward aria-hidden="true" />
        </button>
      </div>
    </>
  )
}

export default FaceStep
