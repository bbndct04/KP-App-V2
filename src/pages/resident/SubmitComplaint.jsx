import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'
import { Button, Field, Input, Select, Textarea } from '../../components/ui'
import { formatDate, formatTime } from '../../lib/cases'
import {
  MdOutlineCheckCircle,
  MdOutlineSend,
  MdOutlineWarningAmber,
  MdOutlineLocationOn,
  MdOutlineSchedule,
  MdOutlineCloudUpload,
  MdOutlineAttachFile,
  MdClose,
  MdArrowBack,
  MdArrowForward,
  MdOutlineEdit,
} from 'react-icons/md'

const CATEGORIES = [
  'Physical Injury',
  'Oral Defamation / Slander',
  'Threat / Intimidation',
  'Unjust Vexation',
  'Property Dispute / Boundary Conflict',
  'Estafa / Fraud',
  'Unpaid Debt / Collection',
  'Theft / Robbery',
  'Trespassing',
  'Vandalism / Malicious Mischief',
  'Domestic Dispute / Family Conflict',
  'Noise Disturbance / Public Nuisance',
  'Light Offenses',
  'Other',
]

const STEPS = [
  { title: 'About you', subtitle: 'Check that your details are correct.' },
  { title: 'The other person', subtitle: 'Who is your complaint against?' },
  { title: 'What happened', subtitle: 'Tell the barangay about the incident.' },
  { title: 'Review and submit', subtitle: 'Make sure everything is correct before submitting.' },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const today = () => new Date().toLocaleDateString('en-CA')

function SubmitComplaint() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const formRef = useRef(null)
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    complainantName: profile?.full_name || '',
    complainantContact: profile?.contact_number || '',
    complainantAddress: profile?.address || '',
    respondentName: '',
    respondentAddress: '',
    category: '',
    otherCategory: '',
    incidentDate: '',
    incidentTime: '',
    location: '',
    description: '',
    reliefRequested: '',
  })
  const [file, setFile] = useState(null)
  const [certified, setCertified] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successRef, setSuccessRef] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const finalCategory = form.category === 'Other' ? form.otherCategory.trim() : form.category

  function goTo(next) {
    setError('')
    setStep(next)
    document.querySelector('main')?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }

  function handleNext() {
    if (formRef.current.reportValidity()) goTo(step + 1)
  }

  function handleFileChange(e) {
    const f = e.target.files[0]
    e.target.value = ''
    if (!f) return
    if (f.size > MAX_FILE_SIZE) return setError('That file is too large. The maximum size is 10MB.')
    if (!ALLOWED_FILE_TYPES.includes(f.type)) return setError('Unsupported file type. Please upload a photo, PDF, or Word document.')
    setError('')
    setFile(f)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (step < STEPS.length - 1) return handleNext()
    if (!certified) return setError('Please confirm that the information you gave is true and correct.')

    setError('')
    setSubmitting(true)

    let attachmentUrl = null
    if (file) {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-80)
      const path = `${user.id}/${Date.now()}-${safeName}`
      const { error: uploadError } = await supabase.storage.from('complaint-attachments').upload(path, file)
      if (uploadError) {
        setSubmitting(false)
        setError("We couldn't upload your evidence file, so the complaint was not submitted. Please try again, or remove the file.")
        return
      }
      attachmentUrl = path
    }

    const { data: inserted, error: insertError } = await supabase
      .from('complaints')
      .insert({
        user_id: user.id,
        category: finalCategory,
        description: form.description.trim(),
        status: 'submitted',
        complainant_name: form.complainantName.trim(),
        complainant_contact: form.complainantContact.trim(),
        complainant_address: form.complainantAddress.trim(),
        respondent_name: form.respondentName.trim(),
        respondent_address: form.respondentAddress.trim(),
        incident_date: form.incidentDate,
        incident_time: form.incidentTime,
        location: form.location.trim(),
        relief_requested: form.reliefRequested.trim(),
        attachment_url: attachmentUrl,
      })
      .select('id, reference_number')
      .single()

    setSubmitting(false)
    if (insertError) {
      setError(`Your complaint could not be submitted. ${insertError.message}`)
      return
    }
    setSuccessRef(inserted.reference_number)
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <AppLayout title="File a Complaint">
      <div className="max-w-[680px] mx-auto">
        <div className="mb-5">
          <div className="flex gap-1.5 mb-3" aria-hidden="true">
            {STEPS.map((s, i) => (
              <div key={s.title} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-accent' : 'bg-border'}`} />
            ))}
          </div>
          <div className="text-ink-faint text-xs font-semibold uppercase tracking-wide">
            Step {step + 1} of {STEPS.length}
          </div>
          <h2 className="text-ink text-xl md:text-2xl font-bold">{current.title}</h2>
          <p className="text-ink-soft text-sm">{current.subtitle}</p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} noValidate={isLast} className="bg-surface border border-border rounded-2xl shadow-token-md">
          <div className="p-5 md:p-6 flex flex-col gap-4">
            {step === 0 && (
              <>
                <Field label="Full name" required>
                  <Input value={form.complainantName} onChange={set('complainantName')} required autoComplete="name" />
                </Field>
                <Field label="Contact number" required hint="The barangay may call or text you about your case.">
                  <Input
                    value={form.complainantContact}
                    onChange={set('complainantContact')}
                    required
                    type="tel"
                    inputMode="tel"
                    pattern="^(\+63|0)9\d{2}[- ]?\d{3}[- ]?\d{4}$"
                    title="Enter a mobile number like 09171234567"
                    placeholder="09171234567"
                    autoComplete="tel"
                  />
                </Field>
                <Field label="Home address" required>
                  <Input
                    value={form.complainantAddress}
                    onChange={set('complainantAddress')}
                    required
                    placeholder="Purok, Street, Barangay New Kababae"
                    autoComplete="street-address"
                  />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Full name of the person" required hint="If you don't know their full name, write what you know (e.g. nickname and surname).">
                  <Input value={form.respondentName} onChange={set('respondentName')} required placeholder="e.g. Pedro Santos" />
                </Field>
                <Field label="Their address" required>
                  <Input value={form.respondentAddress} onChange={set('respondentAddress')} required placeholder="Purok, Street, Barangay" />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Type of complaint" required>
                  <Select value={form.category} onChange={set('category')} required>
                    <option value="">Choose one</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </Field>
                {form.category === 'Other' && (
                  <Field label="Describe the type of complaint" required>
                    <Input value={form.otherCategory} onChange={set('otherCategory')} required placeholder="e.g. Blocked driveway" />
                  </Field>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Date it happened" required>
                    <Input type="date" value={form.incidentDate} onChange={set('incidentDate')} max={today()} required />
                  </Field>
                  <Field label="Time it happened" required>
                    <Input type="time" value={form.incidentTime} onChange={set('incidentTime')} required />
                  </Field>
                </div>
                <Field label="Where it happened" required>
                  <Input value={form.location} onChange={set('location')} required placeholder="e.g. Purok 3, Mabini Street, near the chapel" />
                </Field>
                <Field label="What happened?" required hint="Include what happened, who was involved, and if it happened before.">
                  <Textarea value={form.description} onChange={set('description')} required minLength={20} rows={5} />
                </Field>
                <Field label="What do you want to happen?" required hint="For example: an apology, payment of the debt, or for the noise to stop.">
                  <Textarea value={form.reliefRequested} onChange={set('reliefRequested')} required rows={3} />
                </Field>
                <Field label="Evidence (optional)" hint="Photos, PDF, or Word documents, up to 10MB.">
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                  {file ? (
                    <div className="flex items-center gap-3 bg-success-soft border border-success-strong/25 rounded-lg px-3.5 py-3">
                      <MdOutlineAttachFile className="text-xl text-success-strong flex-shrink-0" aria-hidden="true" />
                      <span className="text-sm font-semibold text-ink truncate flex-1">{file.name}</span>
                      <button type="button" onClick={() => setFile(null)} aria-label="Remove file" className="text-ink-soft hover:text-ink p-1">
                        <MdClose className="text-xl" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="w-full border-2 border-dashed border-border rounded-xl py-5 text-center bg-surface-sunken hover:bg-surface-hover transition-colors"
                    >
                      <MdOutlineCloudUpload className="text-3xl text-ink-faint mx-auto mb-1" aria-hidden="true" />
                      <span className="text-sm font-semibold text-ink">Add a photo or document</span>
                    </button>
                  )}
                </Field>
              </>
            )}

            {isLast && (
              <>
                <ReviewSection title="About you" onEdit={() => goTo(0)}>
                  <ReviewItem label="Name" value={form.complainantName} />
                  <ReviewItem label="Contact" value={form.complainantContact} />
                  <ReviewItem label="Address" value={form.complainantAddress} />
                </ReviewSection>
                <ReviewSection title="Complaint against" onEdit={() => goTo(1)}>
                  <ReviewItem label="Name" value={form.respondentName} />
                  <ReviewItem label="Address" value={form.respondentAddress} />
                </ReviewSection>
                <ReviewSection title="What happened" onEdit={() => goTo(2)}>
                  <ReviewItem label="Type" value={finalCategory} />
                  <ReviewItem
                    label="When"
                    value={`${formatDate(form.incidentDate, { month: 'long', day: 'numeric', year: 'numeric' })} at ${formatTime(form.incidentTime)}`}
                  />
                  <ReviewItem label="Where" value={form.location} />
                  <ReviewItem label="Details" value={form.description} />
                  <ReviewItem label="Request" value={form.reliefRequested} />
                  <ReviewItem label="Evidence" value={file ? file.name : 'None'} />
                </ReviewSection>
                <label className="flex gap-3 items-start bg-surface-sunken border border-border rounded-xl p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={certified}
                    onChange={(e) => setCertified(e.target.checked)}
                    className="mt-0.5 w-5 h-5 accent-[var(--accent)] flex-shrink-0"
                  />
                  <span className="text-sm text-ink leading-relaxed">
                    I certify that the information above is true and correct to the best of my knowledge.
                  </span>
                </label>
              </>
            )}

            {error && (
              <div role="alert" className="bg-danger-soft border border-danger-strong/20 rounded-lg px-4 py-3 text-sm text-danger-strong">
                {error}
              </div>
            )}
          </div>

          <div className="px-5 md:px-6 py-4 border-t border-border flex gap-2.5">
            {step === 0 ? (
              <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
            ) : (
              <Button type="button" variant="secondary" icon={MdArrowBack} onClick={() => goTo(step - 1)} disabled={submitting}>
                Back
              </Button>
            )}
            {isLast ? (
              <Button type="submit" icon={MdOutlineSend} className="flex-1" disabled={submitting || !certified}>
                {submitting ? 'Submitting...' : 'Submit complaint'}
              </Button>
            ) : (
              <Button type="button" className="flex-1" onClick={handleNext}>
                Next <MdArrowForward className="text-lg" aria-hidden="true" />
              </Button>
            )}
          </div>
        </form>
      </div>

      {successRef && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-5">
          <div role="dialog" aria-modal="true" className="bg-surface border border-border rounded-2xl p-6 md:p-8 max-w-[460px] w-full text-center shadow-token-lg max-h-full overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-success-soft text-success-strong flex items-center justify-center mx-auto mb-4">
              <MdOutlineCheckCircle className="text-5xl" aria-hidden="true" />
            </div>
            <h2 className="text-ink text-xl font-bold mb-3">Complaint submitted</h2>

            <div className="bg-surface-sunken border border-border rounded-lg px-4 py-2.5 mb-4">
              <div className="text-xs text-ink-soft mb-1">Your reference number</div>
              <div className="text-2xl font-bold text-accent font-mono">{successRef}</div>
            </div>

            <div className="bg-warning-soft border border-warning-strong/20 rounded-xl px-4 py-3.5 mb-5 text-left flex gap-2.5">
              <MdOutlineWarningAmber className="text-2xl text-warning-strong flex-shrink-0" aria-hidden="true" />
              <div className="text-sm text-warning-strong leading-relaxed">
                <div className="font-bold mb-1">Next step: visit the Barangay Hall within 24 hours</div>
                You need to appear in person so the barangay can formally accept your complaint.
                <div className="text-xs mt-2 font-semibold space-y-0.5">
                  <span className="flex items-center gap-1.5">
                    <MdOutlineLocationOn className="text-base" aria-hidden="true" /> Barangay New Kababae Hall, Olongapo City
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MdOutlineSchedule className="text-base" aria-hidden="true" /> 8:00 AM – 5:00 PM, Monday to Friday
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <Button className="flex-1" onClick={() => navigate(`/track?ref=${successRef}`)}>
                View case
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => navigate('/dashboard')}>
                Go home
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

function ReviewSection({ title, onEdit, children }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-sunken border-b border-border">
        <span className="text-sm font-bold text-ink">{title}</span>
        <button type="button" onClick={onEdit} className="text-accent text-sm font-semibold flex items-center gap-1">
          <MdOutlineEdit aria-hidden="true" /> Edit
        </button>
      </div>
      <dl className="px-4 py-3 space-y-2">{children}</dl>
    </div>
  )
}

function ReviewItem({ label, value }) {
  return (
    <div className="grid grid-cols-[84px_1fr] gap-3 text-sm">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="text-ink whitespace-pre-line break-words">{value || '—'}</dd>
    </div>
  )
}

export default SubmitComplaint
