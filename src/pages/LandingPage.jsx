import { useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import {
  MdOutlineNoteAdd,
  MdOutlineFolderCopy,
  MdOutlineManageSearch,
  MdOutlineNotifications,
} from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/kp-app-logo.png'

// Change this if you later add a custom domain.
const APP_URL = 'https://kp-app-v2.vercel.app'

const FEATURES = [
  {
    icon: MdOutlineNoteAdd,
    title: 'File a complaint',
    text: 'Describe the dispute and send it to the barangay without waiting in line.',
  },
  {
    icon: MdOutlineFolderCopy,
    title: 'Keep your reports',
    text: 'Every complaint you file is saved in My Cases so you can open it again anytime.',
  },
  {
    icon: MdOutlineManageSearch,
    title: 'Track the status',
    text: 'See where your case stands, from filing to settlement.',
  },
  {
    icon: MdOutlineNotifications,
    title: 'Get notified',
    text: 'Receive an alert when the barangay updates your complaint.',
  },
]

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export default function LandingPage() {
  const { user } = useAuth()
  const canvasRef = useRef(null)

  // Signed-in users keep the old behavior: "/" sends them to /login.
  if (user) return <Navigate to="/login" replace />

  const downloadQr = () => {
    const link = document.createElement('a')
    link.href = canvasRef.current.toDataURL('image/png')
    link.download = 'kp-app-qr.png'
    link.click()
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <img src={logo} alt="KP App logo" className="h-10 w-10 rounded-full" />
          <div className="leading-tight">
            <div className="text-base font-bold">KP App</div>
            <div className="text-xs text-ink-faint">Brgy. New Kababae</div>
          </div>
        </div>
        <Link
          to="/login"
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-accent hover:bg-surface-hover ${focus}`}
        >
          Log in
        </Link>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:pt-14">
          <div>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
              File your barangay complaint from your phone.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-ink-soft">
              KP App connects the residents of Brgy. New Kababae with the
              Katarungang Pambarangay. File a complaint, follow its status,
              and get notified when the barangay acts on it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className={`rounded-xl bg-accent px-6 py-3 font-semibold text-accent-ink hover:opacity-90 ${focus}`}
              >
                Log in
              </Link>
              <Link
                to="/register"
                className={`rounded-xl border border-border bg-surface px-6 py-3 font-semibold text-ink hover:bg-surface-hover ${focus}`}
              >
                Create an account
              </Link>
            </div>
          </div>

          {/* QR ticket */}
          <div className="mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-token-lg">
              <div className="px-6 pb-5 pt-6">
                <div className="mb-3 h-1.5 w-12 rounded-full bg-accent" />
                <p className="text-xl font-bold leading-tight">
                  Open KP App on your phone
                </p>
              </div>

              {/* perforation */}
              <div className="relative h-0 border-t-2 border-dashed border-border">
                <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-border bg-bg" />
                <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full border border-border bg-bg" />
              </div>

              <div className="flex flex-col items-center px-6 pb-6 pt-6">
                {/* QR codes need dark-on-white to scan, in both themes */}
                <div className="rounded-2xl bg-white p-2">
                  <QRCodeCanvas
                    ref={canvasRef}
                    value={APP_URL}
                    size={208}
                    marginSize={2}
                    level="M"
                    fgColor="#000000"
                    bgColor="#ffffff"
                    title="QR code that opens KP App"
                  />
                </div>
                <p className="mt-4 text-center text-sm leading-relaxed text-ink-soft">
                  Point your camera at the code and tap the link. Then choose
                  Add to Home Screen to keep the app on your phone.
                </p>
                <button
                  type="button"
                  onClick={downloadQr}
                  className={`mt-4 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-hover ${focus}`}
                >
                  Download QR code
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              What you can do in the app
            </h2>
            <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => {
                const Icon = f.icon
                return (
                  <li key={f.title}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                      <Icon className="text-2xl" aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-ink-soft">
                      {f.text}
                    </p>
                  </li>
                )
              })}
            </ul>
            <p className="mt-12 max-w-2xl border-l-4 border-accent pl-4 text-ink-soft">
              Barangay officials use the same app to review complaints, manage
              cases, and prepare the Katarungang Pambarangay forms.
            </p>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-8 text-sm text-ink-faint">
        KP App, Brgy. New Kababae
      </footer>
    </div>
  )
}