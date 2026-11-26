import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MdOutlineCheckCircle,
  MdOutlineSave,
  MdOutlineCloudUpload,
  MdOutlineAttachFile,
  MdClose,
  MdSearch,
  MdOutlinePersonOutline,
  MdOutlineLink,
  MdOutlinePrint,
} from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/layout/AdminLayout'
import { Button, Field, Input, Select, Textarea } from '../../components/ui'
import { CATEGORIES } from '../../lib/categories'
import CategorySuggestion from '../../components/CategorySuggestion'
import { useT } from '../../i18n/LanguageContext'

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

const EMPTY = {
  complainantName: '',
  complainantContact: '',
  complainantAddress: '',
  respondentName: '',
  respondentAddress: '',
  category: '',
  otherCategory: '',
  incidentDate: '',
  incidentTime: '',
  location: '',
  description: '',
  reliefRequested: '',
}

function ResidentLink({ resident, onSelect }) {
  const { t } = useT()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    const timer = setTimeout(async () => {
      const safe = q.replace(/[%,()]/g, ' ')
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, contact_number, address')
        .eq('role', 'resident')
        .or(`full_name.ilike.%${safe}%,contact_number.ilike.%${safe}%`)
        .order('full_name')
        .limit(5)
      setResults(data || [])
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  if (resident) {
    return (
      <div className="flex items-center gap-3 bg-success-soft border border-success-strong/25 rounded-lg px-3.5 py-3">
        <MdOutlineLink className="text-xl text-success-strong flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink truncate">{resident.full_name}</div>
          <div className="text-xs text-ink-soft">{t('They will see this case in their app and get notifications.')}</div>
        </div>
        <button type="button" onClick={() => onSelect(null)} aria-label={t('Remove link')} className="text-ink-soft hover:text-ink p-1">
          <MdClose className="text-xl" aria-hidden="true" />
        </button>
      </div>
    )
  }

  const shown = query.trim().length >= 2 ? results : []
  return (
    <div className="relative">
      <MdSearch className="absolute left-3 top-[22px] -translate-y-1/2 text-xl text-ink-faint pointer-events-none" aria-hidden="true" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('Search resident by name or contact number')}
        aria-label={t('Search resident account')}
        className="pl-10"
      />
      {shown.length > 0 && (
        <div className="mt-2 border border-border rounded-lg overflow-hidden">
          {shown.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onSelect(r)
                setQuery('')
              }}
              className="w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-surface-hover border-b border-border last:border-b-0"
            >
              <MdOutlinePersonOutline className="text-lg text-ink-faint flex-shrink-0" aria-hidden="true" />
              <span className="text-sm text-ink font-semibold truncate">{r.full_name}</span>
              <span className="text-xs text-ink-faint ml-auto flex-shrink-0">{r.contact_number}</span>
            </button>
          ))}
        </div>
      )}
      {query.trim().length >= 2 && results.length === 0 && (
        <p className="text-xs text-ink-faint mt-2">{t('No resident account found. You can still file it without one.')}</p>
      )}
    </div>
  )
}

function AdminWalkIn() {
  const { t } = useT()
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState(EMPTY)
  const [resident, setResident] = useState(null)
  const [file, setFile] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filed, setFiled] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const finalCategory = form.category === 'Other' ? form.otherCategory.trim() : form.category

  function selectResident(r) {
    setResident(r)
    if (r) {
      setForm((f) => ({
        ...f,
        complainantName: r.full_name || f.complainantName,
        complainantContact: r.contact_number || f.complainantContact,
        complainantAddress: r.address || f.complainantAddress,
      }))
    }
  }

  function handleFileChange(e) {
    const f = e.target.files[0]
    e.target.value = ''
    if (!f) return
    if (f.size > MAX_FILE_SIZE) return setError(t('That file is too large. The maximum size is 10MB.'))
    if (!ALLOWED_FILE_TYPES.includes(f.type)) return setError(t('Unsupported file type. Please upload a photo, PDF, or Word document.'))
    setError('')
    setFile(f)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!confirmed) return setError(t('Please confirm that the complainant appeared in person.'))
    if (form.category === 'Other' && !form.otherCategory.trim()) return setError(t('Please specify the nature of complaint.'))
    setError('')
    setSaving(true)

    let attachmentUrl = null
    if (file) {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-80)
      const path = `${user.id}/${Date.now()}-${safeName}`
      const { error: uploadError } = await supabase.storage.from('complaint-attachments').upload(path, file)
      if (uploadError) {
        setSaving(false)
        return setError(t("We couldn't upload the evidence file, so the complaint was not filed. Please try again, or remove the file."))
      }
      attachmentUrl = path
    }

    const { data, error: rpcError } = await supabase.rpc('file_walk_in_complaint', {
      p_resident: resident?.id || null,
      p_category: finalCategory,
      p_description: form.description.trim(),
      p_complainant_name: form.complainantName.trim(),
      p_complainant_contact: form.complainantContact.trim(),
      p_complainant_address: form.complainantAddress.trim(),
      p_respondent_name: form.respondentName.trim(),
      p_respondent_address: form.respondentAddress.trim(),
      p_incident_date: form.incidentDate,
      p_incident_time: form.incidentTime,
      p_location: form.location.trim(),
      p_relief_requested: form.reliefRequested.trim(),
      p_attachment_url: attachmentUrl,
    })
    setSaving(false)
    if (rpcError) return setError(`${t('The complaint could not be filed.')} ${rpcError.message}`)
    setFiled(Array.isArray(data) ? data[0] : data)
  }

  function fileAnother() {
    setForm(EMPTY)
    setResident(null)
    setFile(null)
    setConfirmed(false)
    setFiled(null)
    window.scrollTo({ top: 0 })
  }

  const section = (n, title, subtitle, children) => (
    <section className="p-5 md:p-7 border-b border-border">
      <div className="flex items-start gap-3 mb-5">
        <span className="w-8 h-8 rounded-full bg-accent text-accent-ink text-sm font-bold flex items-center justify-center flex-shrink-0">{n}</span>
        <div>
          <h3 className="text-ink text-lg font-bold leading-tight">{title}</h3>
          <p className="text-ink-soft text-sm">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )

  return (
    <AdminLayout title={t('Walk-in Complaint')}>
      <div className="max-w-[860px] mx-auto">
        <p className="text-ink-soft text-sm mb-5">
          {t('For residents who file in person at the barangay hall. The complaint goes straight to Active Cases.')}
        </p>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl shadow-token-md">
          {section(
            1,
            t('Complainant Information'),
            t('The resident filing the complaint.'),
            <>
              <Field label={t('Resident account (optional)')} hint={t('Link it if the complainant already has a KP App account.')}>
                <ResidentLink resident={resident} onSelect={selectResident} />
              </Field>
              <Field label={t('Full name of complainant')} required>
                <Input value={form.complainantName} onChange={set('complainantName')} required />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t('Contact number')} hint={t('Used to call or text the complainant about hearings.')}>
                  <Input
                    value={form.complainantContact}
                    onChange={set('complainantContact')}
                    type="tel"
                    inputMode="tel"
                    pattern="^(\+63|0)9\d{2}[- ]?\d{3}[- ]?\d{4}$"
                    title={t('Enter a mobile number like 09171234567')}
                    placeholder="09171234567"
                  />
                </Field>
                <Field label={t('Address of complainant')} required>
                  <Input value={form.complainantAddress} onChange={set('complainantAddress')} required placeholder="Purok, Street, Barangay New Kababae" />
                </Field>
              </div>
            </>
          )}

          {section(
            2,
            t('Respondent Information'),
            t('The person the complaint is against.'),
            <>
              <Field label={t('Full name of respondent')} required hint={t('If the full name is unknown, write the name or alias by which the respondent is known.')}>
                <Input value={form.respondentName} onChange={set('respondentName')} required placeholder="e.g. Pedro Santos" />
              </Field>
              <Field label={t('Address of respondent')} required>
                <Input value={form.respondentAddress} onChange={set('respondentAddress')} required placeholder="Purok, Street, Barangay" />
              </Field>
            </>
          )}

          {section(
            3,
            t('Details of the Complaint'),
            t('Facts of the incident being complained of.'),
            <>
              <Field label={t('Nature of complaint')} required>
                <Select value={form.category} onChange={set('category')} required>
                  <option value="">{t('Choose one')}</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(c)}
                    </option>
                  ))}
                </Select>
              </Field>
              {form.category === 'Other' && (
                <Field label={t('Specify the nature of complaint')} required>
                  <Input value={form.otherCategory} onChange={set('otherCategory')} required placeholder="e.g. Blocked driveway" />
                </Field>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t('Date of incident')} required>
                  <Input type="date" value={form.incidentDate} onChange={set('incidentDate')} max={today()} required />
                </Field>
                <Field label={t('Time of incident')} required>
                  <Input type="time" value={form.incidentTime} onChange={set('incidentTime')} required />
                </Field>
              </div>
              <Field label={t('Place of incident')} required>
                <Input value={form.location} onChange={set('location')} required placeholder="e.g. Purok 3, Mabini Street, near the chapel" />
              </Field>
              <Field label={t('Statement of facts')} required hint={t('Write what the complainant said happened, who were involved, and whether it happened before.')}>
                <Textarea value={form.description} onChange={set('description')} required minLength={20} rows={6} />
              </Field>
              <CategorySuggestion className="-mt-1" text={form.description} value={form.category} onUse={(category) => setForm((f) => ({ ...f, category }))} />
              <Field label={t('Relief sought')} required hint={t('What the complainant is asking the barangay to do.')}>
                <Textarea value={form.reliefRequested} onChange={set('reliefRequested')} required rows={3} />
              </Field>
              <Field label={t('Supporting evidence (optional)')} hint={t('Take a photo of documents, or attach a PDF or Word file, up to 10MB.')}>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                {file ? (
                  <div className="flex items-center gap-3 bg-success-soft border border-success-strong/25 rounded-lg px-3.5 py-3">
                    <MdOutlineAttachFile className="text-xl text-success-strong flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm font-semibold text-ink truncate flex-1">{file.name}</span>
                    <button type="button" onClick={() => setFile(null)} aria-label={t('Remove file')} className="text-ink-soft hover:text-ink p-1">
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
                    <span className="text-sm font-semibold text-ink">{t('Add a photo or document')}</span>
                  </button>
                )}
              </Field>
            </>
          )}

          <section className="p-5 md:p-7 flex flex-col gap-4">
            <label className="flex gap-3 items-start bg-surface-sunken border border-border rounded-xl p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-[var(--accent)] flex-shrink-0"
              />
              <span className="text-sm text-ink leading-relaxed">
                {t('The complainant appeared in person, and the details above were read back to them and are correct.')}
              </span>
            </label>
            {error && (
              <div role="alert" className="bg-danger-soft border border-danger-strong/20 rounded-lg px-4 py-3 text-sm text-danger-strong">
                {error}
              </div>
            )}
            <div className="flex gap-2.5 justify-end pt-2">
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/complaints')} disabled={saving}>
                {t('Cancel')}
              </Button>
              <Button type="submit" icon={MdOutlineSave} disabled={saving || !confirmed}>
                {saving ? t('Saving...') : t('File complaint')}
              </Button>
            </div>
          </section>
        </form>
      </div>

      {filed && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-5">
          <div role="dialog" aria-modal="true" className="bg-surface border border-border rounded-2xl p-6 md:p-8 max-w-[460px] w-full text-center shadow-token-lg">
            <div className="w-16 h-16 rounded-full bg-success-soft text-success-strong flex items-center justify-center mx-auto mb-4">
              <MdOutlineCheckCircle className="text-5xl" aria-hidden="true" />
            </div>
            <h2 className="text-ink text-xl font-bold mb-3">{t('Complaint filed')}</h2>
            <div className="bg-surface-sunken border border-border rounded-lg px-4 py-2.5 mb-4">
              <div className="text-xs text-ink-soft mb-1">{t('Reference number')}</div>
              <div className="text-2xl font-bold text-accent font-mono">{filed.reference_number}</div>
            </div>
            <p className="text-sm text-ink-soft mb-5">
              {t('Print Form 7 (Complaint) and have the complainant sign it. Give them the reference number.')}
            </p>
            <div className="flex flex-col gap-2.5">
              <Button icon={MdOutlinePrint} onClick={() => navigate(`/admin/complaints/${filed.id}/form7`)}>
                {t('Open Form 7 to print')}
              </Button>
              <div className="flex gap-2.5">
                <Button variant="secondary" className="flex-1" onClick={() => navigate(`/admin/cases/${filed.id}`)}>
                  {t('Open case')}
                </Button>
                <Button variant="secondary" className="flex-1" onClick={fileAnother}>
                  {t('File another')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminWalkIn
