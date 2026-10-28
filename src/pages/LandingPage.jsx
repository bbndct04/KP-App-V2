import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import {
  MdOutlineNoteAdd,
  MdOutlineFolderCopy,
  MdOutlineManageSearch,
  MdOutlineNotifications,
  MdOutlineAccountBalance,
  MdOutlineHandshake,
  MdOutlineVerified,
  MdOutlineEvent,
  MdOutlineLock,
  MdArrowForward,
  MdOutlineFileDownload,
  MdExpandMore,
} from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import AuthBackground from '../components/AuthBackground'
import useReveal from '../hooks/useReveal'
import logo from '../assets/kp-app-logo.png'
import barangayLogo from '../assets/barangay-newkababae-logo.jpg'

const APP_URL = 'https://kp-app-v2.vercel.app'

const NAV = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#faq', label: 'FAQ' },
]

const FEATURES = [
  { icon: MdOutlineNoteAdd, title: 'File a complaint', text: 'Describe the dispute and send it to the barangay without waiting in line.' },
  { icon: MdOutlineManageSearch, title: 'Track the status', text: 'See where your case stands, from filing to settlement, step by step.' },
  { icon: MdOutlineEvent, title: 'Hearing reminders', text: 'Get your hearing date and time, plus a reminder the day before.' },
  { icon: MdOutlineNotifications, title: 'Get notified', text: 'Receive an alert when your complaint is accepted or a summons is issued.' },
  { icon: MdOutlineFolderCopy, title: 'Keep your records', text: 'Every complaint you file is saved in My Cases so you can open it again anytime.' },
  { icon: MdOutlineLock, title: 'Private and secure', text: 'Your ID and case details are visible only to you and barangay officials.' },
]

const FAQS = [
  {
    q: 'What kinds of disputes can the barangay handle?',
    a: 'Most disputes between residents, such as unpaid debts, property and boundary conflicts, noise, slander, threats, and minor physical injuries. Serious crimes, cases involving the government, and some other disputes are outside the barangay and go directly to the proper office.',
  },
  {
    q: 'Can I file about an incident outside Barangay New Kababae?',
    a: 'No. This app is for Barangay New Kababae. If the incident happened elsewhere, please go to the barangay where it took place.',
  },
  {
    q: 'Do I still need to go to the Barangay Hall?',
    a: 'Yes. After filing online, appear in person at the Barangay Hall within 24 hours (8AM–5PM, Monday to Friday) so the barangay can accept your complaint.',
  },
  {
    q: 'How long does the process take?',
    a: 'Mediation before the Punong Barangay lasts up to 15 days. If no agreement is reached, a Pangkat hears the case for another 15 days, which may be extended by 15 more days.',
  },
  {
    q: 'Do I need a lawyer?',
    a: 'No. Under the Katarungang Pambarangay law, parties appear in person without lawyers. Minors and persons who need help may be assisted by a family member.',
  },
  {
    q: 'What happens if we cannot agree?',
    a: 'The barangay issues a Certificate to File Action. You can then bring the case to court or the prosecutor.',
  },
  {
    q: 'Is my personal information safe?',
    a: 'Your ID photo, face photo, and case details are only visible to you and authorized barangay officials, in line with the Data Privacy Act of 2012.',
  },
]

const STEPS = [
  { icon: MdOutlineNoteAdd, title: 'File online', text: 'Fill in a short 4-step form from your phone.' },
  { icon: MdOutlineAccountBalance, title: 'Visit the hall', text: 'Appear at the Barangay Hall within 24 hours so it can be accepted.' },
  { icon: MdOutlineHandshake, title: 'Mediation', text: 'The Punong Barangay or a Pangkat helps both sides talk it out.' },
  { icon: MdOutlineVerified, title: 'Resolution', text: 'Reach a settlement, or receive a Certificate to File Action.' },
]

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

function FaqItem({ q, a, open, onToggle, id }) {
  return (
    <div className="border-b border-border last:border-0">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          className={`flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-base font-semibold text-ink sm:text-lg ${focus}`}
        >
          {q}
          <MdExpandMore className={`flex-shrink-0 text-2xl text-accent transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </h3>
      <div id={id} className={`faq-panel ${open ? 'open' : ''}`}>
        <div>
          <p className="px-6 pb-5 leading-relaxed text-ink-soft">{a}</p>
        </div>
      </div>
    </div>
  )
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map(([label, to]) => (
          <li key={label}>
            {to.startsWith('#') ? (
              <a href={to} className={`rounded text-ink-soft transition-colors hover:text-ink ${focus}`}>
                {label}
              </a>
            ) : (
              <Link to={to} className={`rounded text-ink-soft transition-colors hover:text-ink ${focus}`}>
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function TiltCard({ children }) {
  const ref = useRef(null)
  const canTilt = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

  function onMove(e) {
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    ref.current.style.setProperty('--ry', `${x * 10}deg`)
    ref.current.style.setProperty('--rx', `${-y * 10}deg`)
  }

  function onLeave() {
    ref.current.style.setProperty('--ry', '0deg')
    ref.current.style.setProperty('--rx', '0deg')
  }

  return (
    <div ref={ref} className="tilt" onPointerMove={canTilt ? onMove : undefined} onPointerLeave={canTilt ? onLeave : undefined}>
      {children}
    </div>
  )
}

export default function LandingPage() {
  const { user } = useAuth()
  const canvasRef = useRef(null)
  const pageRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)
  useReveal(pageRef)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (user) return <Navigate to="/login" replace />

  const downloadQr = () => {
    const link = document.createElement('a')
    link.href = canvasRef.current.toDataURL('image/png')
    link.download = 'kp-app-qr.png'
    link.click()
  }

  return (
    <div ref={pageRef} className="min-h-screen bg-bg text-ink">
      <div className="scroll-progress" aria-hidden="true" />

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled ? 'bg-surface border-b border-border' : 'on-dark bg-transparent'
        }`}
      >
        <div className={`mx-auto flex max-w-6xl items-center justify-between px-6 transition-[padding] duration-300 ${scrolled ? 'py-3' : 'py-5'}`}>
          <div className="flex items-center gap-3">
            <img src={logo} alt="KP App logo" className="h-10 w-10 rounded-full" />
            <div className="leading-tight">
              <div className="text-base font-bold text-ink">KP App</div>
              <div className="text-xs text-ink-faint">Brgy. New Kababae</div>
            </div>
          </div>
          <nav aria-label="Page sections" className="hidden md:block">
            <ul className="flex items-center gap-8">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className={`rounded text-sm font-medium text-ink-soft transition-colors hover:text-ink ${focus}`}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/register" className={`hidden sm:inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-ink-soft hover:text-ink ${focus}`}>
              Register
            </Link>
            <Link to="/login" className={`rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-accent-hover ${focus}`}>
              Log in
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <AuthBackground contained />
          <div className="on-dark relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-32 lg:grid-cols-[1.1fr_0.9fr] lg:pb-28 lg:pt-40">
            <div>
              <div className="fade-up inline-flex items-center gap-2 rounded-full border border-border bg-surface-hover px-3 py-1.5 text-xs font-semibold text-ink-soft">
                <img src={barangayLogo} alt="" className="h-5 w-5 rounded-full bg-white" />
                Official portal of Barangay New Kababae
              </div>
              <h1 className="fade-up delay-1 mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-6xl">
                File your barangay complaint from your phone.
              </h1>
              <p className="fade-up delay-2 mt-6 max-w-[34rem] text-lg leading-relaxed text-ink-soft">
                KP App connects residents with the Katarungang Pambarangay. File a complaint, follow its progress, and get
                notified when the barangay acts on it.
              </p>
              <div className="fade-up delay-3 mt-8 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className={`inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-[#0b1f4d] transition-transform hover:-translate-y-0.5 active:scale-[0.97] ${focus}`}
                >
                  Create an account <MdArrowForward aria-hidden="true" />
                </Link>
                <Link
                  to="/login"
                  className={`rounded-xl border border-border px-6 py-3 font-semibold text-ink transition-colors hover:bg-surface-hover ${focus}`}
                >
                  Log in
                </Link>
              </div>
            </div>

            <div className="fade-up delay-2 mx-auto w-full max-w-sm">
              <TiltCard>
                <div className="overflow-hidden rounded-3xl bg-white text-[#16213e] shadow-token-lg">
                  <div className="px-6 pb-5 pt-6">
                    <div className="mb-3 h-1.5 w-12 rounded-full bg-[#1a5fd4]" />
                    <p className="text-xl font-bold leading-tight">Open KP App on your phone</p>
                  </div>
                  <div className="relative h-0 border-t-2 border-dashed border-[#dde3ee]">
                    <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[#0b1f4d]" />
                    <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-[#0b1f4d]" />
                  </div>
                  <div className="flex flex-col items-center px-6 pb-6 pt-6">
                    <QRCodeCanvas
                      ref={canvasRef}
                      value={APP_URL}
                      size={200}
                      marginSize={2}
                      level="M"
                      fgColor="#000000"
                      bgColor="#ffffff"
                      title="QR code that opens KP App"
                    />
                    <p className="mt-4 text-center text-sm leading-relaxed text-[#55607a]">
                      Scan with your camera, then choose <strong>Add to Home Screen</strong> to keep the app on your phone.
                    </p>
                    <button
                      type="button"
                      onClick={downloadQr}
                      className={`mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#dde3ee] px-4 py-2 text-sm font-semibold hover:bg-[#f5f8fc] ${focus}`}
                    >
                      <MdOutlineFileDownload className="text-lg" aria-hidden="true" /> Download QR code
                    </button>
                  </div>
                </div>
              </TiltCard>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 mx-auto max-w-6xl px-6 py-20">
          <div className="reveal max-w-2xl">
            <div className="text-sm font-bold uppercase tracking-wide text-accent">How it works</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">From complaint to settlement</h2>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <li key={s.title} className="reveal relative" style={{ '--d': `${i * 0.1}s` }}>
                  {i < STEPS.length - 1 && (
                    <div className="absolute left-12 right-0 top-6 hidden h-0.5 bg-border md:block" aria-hidden="true" />
                  )}
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-ink">
                    <Icon className="text-2xl" aria-hidden="true" />
                  </div>
                  <div className="mt-4 text-xs font-bold text-ink-faint">STEP {i + 1}</div>
                  <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-ink-soft">{s.text}</p>
                </li>
              )
            })}
          </ol>
        </section>

        <section id="features" className="scroll-mt-20 border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="reveal max-w-2xl">
              <div className="text-sm font-bold uppercase tracking-wide text-accent">Features</div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">What you can do in the app</h2>
            </div>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => {
                const Icon = f.icon
                return (
                  <li key={f.title} className="reveal lift rounded-2xl border border-border bg-bg p-5" style={{ '--d': `${(i % 3) * 0.08}s` }}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                      <Icon className="text-2xl" aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-ink-soft">{f.text}</p>
                  </li>
                )
              })}
            </ul>
            <p className="reveal mt-12 max-w-2xl border-l-4 border-accent pl-4 text-ink-soft">
              Barangay officials use the same app to review complaints, manage cases, and prepare the Katarungang Pambarangay forms.
            </p>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 mx-auto max-w-4xl px-6 pt-20">
          <div className="reveal text-center">
            <div className="text-sm font-bold uppercase tracking-wide text-accent">FAQ</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Common questions</h2>
          </div>
          <div className="reveal mt-10 overflow-hidden rounded-3xl border border-border bg-surface" style={{ '--d': '0.1s' }}>
            {FAQS.map((f, i) => (
              <FaqItem key={f.q} id={`faq-${i}`} q={f.q} a={f.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="reveal on-dark relative overflow-hidden rounded-3xl px-8 py-12 text-center sm:px-12" style={{ background: 'linear-gradient(120deg, #0b1f4d, #1a5fd4)' }}>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Have a dispute with a neighbor?</h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-soft">
              Start with the barangay. Most cases are settled through mediation, without going to court.
            </p>
            <Link
              to="/register"
              className={`mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-[#0b1f4d] transition-transform hover:-translate-y-0.5 active:scale-[0.97] ${focus}`}
            >
              Get started <MdArrowForward aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="on-dark" style={{ background: '#0b1f4d' }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="" className="h-10 w-10 rounded-full" />
              <div className="text-lg font-bold text-ink">KP App</div>
            </div>
            <p className="mt-4 leading-relaxed text-ink-soft">
              The Katarungang Pambarangay portal of Barangay New Kababae, Olongapo City.
            </p>
          </div>
          <FooterCol
            title="Residents"
            links={[
              ['File a complaint', '/register'],
              ['Log in', '/login'],
              ['Create an account', '/register'],
              ['Forgot password', '/forgot-password'],
            ]}
          />
          <FooterCol
            title="Learn"
            links={[
              ['How it works', '#how-it-works'],
              ['Features', '#features'],
              ['FAQ', '#faq'],
            ]}
          />
          <div>
            <h3 className="text-lg font-bold text-ink">Barangay Hall</h3>
            <ul className="mt-4 space-y-3 text-ink-soft">
              <li>Barangay New Kababae, Olongapo City</li>
              <li>8:00 AM – 5:00 PM</li>
              <li>Monday to Friday</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <p className="mx-auto max-w-6xl px-6 py-6 text-center text-sm text-ink-faint">
            © {new Date().getFullYear()} KP App · Barangay New Kababae. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
