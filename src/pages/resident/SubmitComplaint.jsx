import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'

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
    setFile(f)
    setFileName(f.name)
  }

  async function generateReferenceNumber() {
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`)
    const next = (count || 0) + 1
    return `KP-${year}-${String(next).padStart(3, '0')}`
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

    const referenceNumber = await generateReferenceNumber()

    let attachmentUrl = null
    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('complaint-attachments').upload(path, file)
      if (!uploadError) {
        attachmentUrl = path
      }
    }

    const { error: insertError } = await supabase.from('complaints').insert({
      user_id: user.id,
      reference_number: referenceNumber,
      category: finalCategory,
      description,
      status: 'pending',
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

    setSubmitting(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setSuccessRef(referenceNumber)
  }

  return (
    <AppLayout title="Submit Complaint">
      <div className="max-w-[780px] mx-auto">
        {/* Info Banner */}
        <div className="bg-blue-500/15 border border-blue-400/30 rounded-xl px-4 py-3 mb-5 flex items-center gap-2.5">
          <span className="text-blue-300">ℹ️</span>
          <span className="text-[13.5px] text-blue-200">
            A unique reference number (e.g. <strong className="text-white">KP-2026-001</strong>) will be automatically generated after submission.
          </span>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-400/30 rounded-lg px-4 py-3 mb-5 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-2xl overflow-hidden">
          <div className="px-6 py-4.5 bg-blue-900/60 border-b border-white/10">
            <div className="text-white text-[15px] font-bold">📝 Complaint / Incident Report Form</div>
            <div className="text-blue-200/60 text-xs mt-0.5">All fields marked * are required</div>
          </div>

          <div className="p-6">
            {/* Section 1 */}
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wide text-blue-200 bg-blue-500/15 px-3 py-2 rounded-md mb-4">
                👤 Section 1 — Complainant Information
              </div>

              <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Full Name of Complainant *</label>
                  <input
                    value={complainantName}
                    onChange={(e) => setComplainantName(e.target.value)}
                    required
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Contact Number *</label>
                  <input
                    value={complainantContact}
                    onChange={(e) => setComplainantContact(e.target.value)}
                    required
                    placeholder="09XX-XXX-XXXX"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Complainant Address *</label>
                <input
                  value={complainantAddress}
                  onChange={(e) => setComplainantAddress(e.target.value)}
                  required
                  placeholder="Purok, Street, Barangay New Kababae, Olongapo City"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>
            </div>

            {/* Section 2 */}
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wide text-red-200 bg-red-500/15 px-3 py-2 rounded-md mb-4">
                ⚠️ Section 2 — Subject of Complaint
              </div>

              <div className="mb-3.5">
                <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Name of Person / Subject of Complaint *</label>
                <input
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  required
                  placeholder="Full name of the person being complained against"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Address of Subject of Complaint *</label>
                <input
                  value={respondentAddress}
                  onChange={(e) => setRespondentAddress(e.target.value)}
                  required
                  placeholder="Purok, Street, Barangay, City"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>
            </div>

            {/* Section 3 */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-green-200 bg-green-500/15 px-3 py-2 rounded-md mb-4">
                📋 Section 3 — Incident Details
              </div>

              <div className="mb-3.5">
                <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Complaint Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 [color-scheme:dark]"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {category === 'Other' && (
                <div className="mb-3.5">
                  <label className="block text-sm font-semibold text-amber-200 mb-1.5">Please specify your complaint *</label>
                  <input
                    value={otherCategory}
                    onChange={(e) => setOtherCategory(e.target.value)}
                    required
                    placeholder="Describe your specific complaint category..."
                    className="w-full bg-amber-500/10 border border-amber-400/40 text-white placeholder-amber-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Incident Date *</label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Incident Time *</label>
                  <input
                    type="time"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    required
                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="mb-3.5">
                <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Incident Location *</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  placeholder="e.g. Purok 3, Mabini Street, near the church"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              <div className="mb-3.5">
                <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Description of Incident *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe the incident in detail — what happened, how it started, and any other relevant information."
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-vertical"
                />
              </div>

              <div className="mb-3.5">
                <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">Relief Requested *</label>
                <textarea
                  value={reliefRequested}
                  onChange={(e) => setReliefRequested(e.target.value)}
                  required
                  rows={3}
                  placeholder="What action or resolution are you requesting from the barangay?"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/40 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-vertical"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-blue-100/90 mb-1.5">
                  Attach Evidence <span className="text-blue-200/40 font-normal">(Optional)</span>
                </label>
                <div
                  onClick={() => document.getElementById('file-input').click()}
                  className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <input type="file" id="file-input" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                  {!fileName ? (
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">Click to upload evidence</div>
                      <div className="text-xs text-blue-200/50">Photos, PDF, Word documents — Max 10MB</div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2.5">
                      <span className="text-green-300">✓</span>
                      <div>
                        <div className="text-sm font-semibold text-green-300">{fileName}</div>
                        <div className="text-xs text-blue-200/50">Click to change file</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-black/10 flex gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 border border-white/20 text-blue-200/80 rounded-lg py-2.5 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[3] bg-blue-500/90 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg py-2.5 shadow-lg shadow-blue-500/30 border border-blue-400/30"
            >
              {submitting ? 'Submitting...' : '📨 Submit Report'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {successRef && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="bg-blue-950/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-8 max-w-[460px] w-full text-center shadow-2xl">
            <div className="w-[72px] h-[72px] rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4.5 text-3xl">✅</div>
            <h2 className="text-white text-xl font-bold mb-2">Complaint Submitted!</h2>

            <div className="bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 mb-4">
              <div className="text-xs text-blue-200/60 mb-1">Your Reference Number</div>
              <div className="text-2xl font-bold text-blue-300 font-mono">{successRef}</div>
            </div>

            <div className="bg-amber-500/15 border border-amber-400/30 rounded-xl px-4 py-3.5 mb-5 text-left flex gap-2.5">
              <span className="text-lg flex-shrink-0">⚠️</span>
              <div>
                <div className="text-sm font-bold text-amber-200 mb-1">Important Notice</div>
                <div className="text-[13px] text-amber-100/80 leading-relaxed">
                  The complainant must <strong className="text-white">personally appear at the Barangay Hall</strong> within <strong className="text-white">24 hours</strong> from submission to formally file this complaint.
                </div>
                <div className="text-xs text-amber-200/80 mt-2 font-semibold leading-relaxed">
                  📍 Barangay New Kababae Hall, Olongapo City<br />
                  ⏰ 8:00 AM – 5:00 PM, Monday to Friday
                </div>
              </div>
            </div>

            <p className="text-[13px] text-blue-200/60 mb-5 leading-relaxed">
              Save your reference number. You can use it to track your complaint status anytime.
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => navigate(`/track?ref=${successRef}`)}
                className="flex-1 bg-blue-500/90 hover:bg-blue-500 text-white rounded-lg py-3 text-sm font-semibold border border-blue-400/30"
              >
                Track Status
              </button>
              <button
                onClick={() => navigate('/my-reports')}
                className="flex-1 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-lg py-3 text-sm font-semibold"
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