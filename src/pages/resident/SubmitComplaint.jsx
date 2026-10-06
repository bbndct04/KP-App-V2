import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'
import {
  MdOutlineInfo,
  MdOutlineEditNote,
  MdOutlinePerson,
  MdOutlinePersonOff,
  MdOutlineAssignment,
  MdOutlineCheckCircle,
  MdOutlineSend,
  MdOutlineWarningAmber,
  MdOutlineLocationOn,
  MdOutlineSchedule,
  MdOutlineCloudUpload,
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

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

function SubmitComplaint() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [complainantName, setComplainantName] = useState(profile?.full_name || '')
  const [complainantContact, setComplainantContact] = useState(profile?.contact_number || '')
  const [complainantAddress, setComplainantAddress] = useState(profile?.address || '')
  const [respondentName, setRespondentName] = useState('')
  const [respondentAddress, setRespondentAddress] = useState('')
  const [category, setCategory] = useState('')
  const [otherCategory, setOtherCategory] = useState('')
  const [incidentDate, setIncidentDate] = useState('')
  const [incidentTime, setIncidentTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [reliefRequested, setReliefRequested] = useState('')
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successRef, setSuccessRef] = useState(null)

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return

    if (f.size > MAX_FILE_SIZE) {
      setError('File is too large. Max size is 10MB.')
      e.target.value = ''
      return
    }
    if (!ALLOWED_FILE_TYPES.includes(f.type)) {
      setError('Unsupported file type. Please upload an image, PDF, or Word document.')
      e.target.value = ''
      return
    }

    setError('')
    setFile(f)
    setFileName(f.name)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const finalCategory = category === 'Other' ? otherCategory : category
    if (!finalCategory) {
      setError('Please select or specify a category.')
      return
    }

    setSubmitting(true)

    let attachmentUrl = null
    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('complaint-attachments').upload(path, file)
      if (!uploadError) {
        attachmentUrl = path
      }
    }

    const { data: inserted, error: insertError } = await supabase
      .from('complaints')
      .insert({
        user_id: user.id,
        category: finalCategory,
        description,
        status: 'filed',
        complainant_name: complainantName,
        complainant_contact: complainantContact,
        complainant_address: complainantAddress,
        respondent_name: respondentName,
        respondent_address: respondentAddress,
        incident_date: incidentDate,
        incident_time: incidentTime,
        location,
        relief_requested: reliefRequested,
        attachment_url: attachmentUrl,
      })
      .select('id, reference_number')
      .single()

    if (insertError) {
      setSubmitting(false)
      setError(insertError.message)
      return
    }

    await supabase.from('complaint_notifications').insert({
      complaint_id: inserted.id,
      user_id: user.id,
      title: 'Complaint Received',
      type: 'info',
      message: `Your complaint has been received and filed (Ref: ${inserted.reference_number}). You'll be notified as it progresses.`,
    })

    setSubmitting(false)
    setSuccessRef(inserted.reference_number)
  }

  return (
    <AppLayout title="Submit Complaint">
      <div className="max-w-[780px] mx-auto">
        {/* Info Banner */}
        <div className="bg-info-soft border border-info-strong/20 rounded-xl px-4 py-3 mb-5 flex items-center gap-2.5">
          <MdOutlineInfo className="text-xl text-info-strong flex-shrink-0" aria-hidden="true" />
          <span className="text-sm text-info-strong">
            A unique reference number (e.g. <strong className="text-ink">KP-2026-001</strong>) will be automatically generated after submission.
          </span>
        </div>

        {error && (
          <div className="bg-danger-soft border border-danger-strong/20 rounded-lg px-4 py-3 mb-5 text-sm text-danger-strong">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-token-md">
          <div className="px-6 py-4.5 bg-surface-hover border-b border-border">
            <div className="text-ink text-base font-bold flex items-center gap-2"><MdOutlineEditNote className="text-2xl text-accent" aria-hidden="true" /> Complaint / Incident Report Form</div>
            <div className="text-ink-soft text-xs mt-0.5">All fields marked * are required</div>
          </div>

          <div className="p-6">
            {/* Section 1 */}
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wide text-info-strong bg-info-soft px-3 py-2 rounded-md mb-4 flex items-center gap-2">
                <MdOutlinePerson className="text-lg" aria-hidden="true" /> Section 1 — Complainant Information
              </div>

              <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1.5">Full Name of Complainant *</label>
                  <input
                    value={complainantName}
                    onChange={(e) => setComplainantName(e.target.value)}
                    required
                    className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1.5">Contact Number *</label>
                  <input
                    value={complainantContact}
                    onChange={(e) => setComplainantContact(e.target.value)}
                    required
                    placeholder="09XX-XXX-XXXX"
                    className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">Complainant Address *</label>
                <input
                  value={complainantAddress}
                  onChange={(e) => setComplainantAddress(e.target.value)}
                  required
                  placeholder="Purok, Street, Barangay New Kababae, Olongapo City"
                  className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>

            {/* Section 2 */}
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wide text-danger-strong bg-danger-soft px-3 py-2 rounded-md mb-4 flex items-center gap-2">
                <MdOutlinePersonOff className="text-lg" aria-hidden="true" /> Section 2 — Subject of Complaint
              </div>

              <div className="mb-3.5">
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">Name of Person / Subject of Complaint *</label>
                <input
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  required
                  placeholder="Full name of the person being complained against"
                  className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">Address of Subject of Complaint *</label>
                <input
                  value={respondentAddress}
                  onChange={(e) => setRespondentAddress(e.target.value)}
                  required
                  placeholder="Purok, Street, Barangay, City"
                  className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>

            {/* Section 3 */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-success-strong bg-success-soft px-3 py-2 rounded-md mb-4 flex items-center gap-2">
                <MdOutlineAssignment className="text-lg" aria-hidden="true" /> Section 3 — Incident Details
              </div>

              <div className="mb-3.5">
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">Complaint Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full bg-surface-sunken border border-border text-ink rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {category === 'Other' && (
                <div className="mb-3.5">
                  <label className="block text-sm font-semibold text-warning-strong mb-1.5">Please specify your complaint *</label>
                  <input
                    value={otherCategory}
                    onChange={(e) => setOtherCategory(e.target.value)}
                    required
                    placeholder="Describe your specific complaint category..."
                    className="w-full bg-warning-soft border border-warning-strong/30 text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-warning-strong/40"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1.5">Incident Date *</label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full bg-surface-sunken border border-border text-ink rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1.5">Incident Time *</label>
                  <input
                    type="time"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    required
                    className="w-full bg-surface-sunken border border-border text-ink rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              </div>

              <div className="mb-3.5">
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">Incident Location *</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  placeholder="e.g. Purok 3, Mabini Street, near the church"
                  className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              <div className="mb-3.5">
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">Description of Incident *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe the incident in detail — what happened, how it started, and any other relevant information."
                  className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-vertical"
                />
              </div>

              <div className="mb-3.5">
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">Relief Requested *</label>
                <textarea
                  value={reliefRequested}
                  onChange={(e) => setReliefRequested(e.target.value)}
                  required
                  rows={3}
                  placeholder="What action or resolution are you requesting from the barangay?"
                  className="w-full bg-surface-sunken border border-border text-ink placeholder-ink-faint rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-vertical"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">
                  Attach Evidence <span className="text-ink-faint font-normal">(Optional)</span>
                </label>
                <div
                  onClick={() => document.getElementById('file-input').click()}
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer bg-surface-sunken hover:bg-surface-hover transition-colors"
                >
                  <input type="file" id="file-input" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                  {!fileName ? (
                    <div>
                      <MdOutlineCloudUpload className="text-4xl text-ink-faint mx-auto mb-2" aria-hidden="true" />
                      <div className="text-sm font-semibold text-ink mb-1">Click to upload evidence</div>
                      <div className="text-xs text-ink-faint">Photos, PDF, Word documents — Max 10MB</div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2.5">
                      <MdOutlineCheckCircle className="text-2xl text-success-strong flex-shrink-0" aria-hidden="true" />
                      <div>
                        <div className="text-sm font-semibold text-success-strong">{fileName}</div>
                        <div className="text-xs text-ink-faint">Click to change file</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-surface-sunken flex gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 border border-border text-ink-soft rounded-lg py-2.5 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[3] bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-ink font-semibold text-sm rounded-lg py-2.5 shadow-token-md"
            >
              {submitting ? 'Submitting...' : <span className="inline-flex items-center gap-2"><MdOutlineSend aria-hidden="true" /> Submit Report</span>}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {successRef && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-5">
          <div className="bg-surface border border-border rounded-2xl p-8 max-w-[460px] w-full text-center shadow-token-lg">
            <div className="w-[72px] h-[72px] rounded-full bg-success-soft text-success-strong flex items-center justify-center mx-auto mb-4.5"><MdOutlineCheckCircle className="text-5xl" aria-hidden="true" /></div>
            <h2 className="text-ink text-xl font-bold mb-2">Complaint Submitted!</h2>

            <div className="bg-surface-sunken border border-border rounded-lg px-4 py-2.5 mb-4">
              <div className="text-xs text-ink-soft mb-1">Your Reference Number</div>
              <div className="text-2xl font-bold text-accent font-mono">{successRef}</div>
            </div>

            <div className="bg-warning-soft border border-warning-strong/20 rounded-xl px-4 py-3.5 mb-5 text-left flex gap-2.5">
              <MdOutlineWarningAmber className="text-2xl text-warning-strong flex-shrink-0" aria-hidden="true" />
              <div>
                <div className="text-sm font-bold text-warning-strong mb-1">Important Notice</div>
                <div className="text-sm text-warning-strong leading-relaxed">
                  The complainant must <strong>personally appear at the Barangay Hall</strong> within <strong>24 hours</strong> from submission to formally file this complaint.
                </div>
                <div className="text-xs text-warning-strong mt-2 font-semibold leading-relaxed">
                  <span className="flex items-center gap-1.5"><MdOutlineLocationOn className="text-base" aria-hidden="true" /> Barangay New Kababae Hall, Olongapo City</span>
                  <span className="flex items-center gap-1.5"><MdOutlineSchedule className="text-base" aria-hidden="true" /> 8:00 AM – 5:00 PM, Monday to Friday</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-ink-soft mb-5 leading-relaxed">
              Save your reference number. You can use it to track your complaint status anytime.
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => navigate(`/track?ref=${successRef}`)}
                className="flex-1 bg-accent hover:bg-accent-hover text-accent-ink rounded-lg py-3 text-sm font-semibold shadow-token-sm"
              >
                Track Status
              </button>
              <button
                onClick={() => navigate('/my-reports')}
                className="flex-1 bg-surface-sunken hover:bg-surface-hover text-ink border border-border rounded-lg py-3 text-sm font-semibold"
              >
                My Reports
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default SubmitComplaint