import { useEffect, useState } from 'react'
import { MdOutlineAccountBalance, MdOutlineBadge, MdOutlineSave } from 'react-icons/md'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/toastContext'
import AdminLayout from '../../components/layout/AdminLayout'
import { Card, CardHeader, Field, Input, Select, Button, Skeleton } from '../../components/ui'

const EMPTY = { province: '', locality_type: 'City', locality: '', barangay: '', punong_barangay: '', secretary: '' }

function AdminSettings() {
  const { user } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      const { data } = await supabase.from('barangay_settings').select('*').eq('id', 1).maybeSingle()
      if (!cancelled) setForm({ ...EMPTY, ...(data || {}) })
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('barangay_settings').upsert({
      id: 1,
      province: form.province.trim(),
      locality_type: form.locality_type,
      locality: form.locality.trim(),
      barangay: form.barangay.trim(),
      punong_barangay: form.punong_barangay.trim(),
      secretary: form.secretary.trim(),
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    setSaving(false)
    if (error) {
      toast.error(`The settings could not be saved. ${error.message}`)
      return
    }
    toast.success('Barangay settings saved. New drafts will use them; forms already issued keep their original details.')
  }

  return (
    <AdminLayout title="Barangay Settings">
      <p className="text-ink-soft text-sm mb-4">These details fill the header and signature lines of every official form.</p>

      {!form ? (
        <div className="flex flex-col gap-4 max-w-[720px]">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : (
        <form onSubmit={save} className="flex flex-col gap-4 max-w-[720px]">
          <Card>
            <CardHeader icon={MdOutlineAccountBalance} title="Barangay" subtitle="Printed at the top of each form" />
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Province" required>
                <Input value={form.province} onChange={(e) => update('province', e.target.value)} aria-label="Province" required />
              </Field>
              <Field label="City or municipality" required>
                <div className="flex gap-2">
                  <Select value={form.locality_type} onChange={(e) => update('locality_type', e.target.value)} aria-label="City or Municipality" className="w-auto">
                    <option value="City">City</option>
                    <option value="Municipality">Municipality</option>
                  </Select>
                  <Input value={form.locality} onChange={(e) => update('locality', e.target.value)} aria-label="City or municipality name" required />
                </div>
              </Field>
              <Field label="Barangay" required>
                <Input value={form.barangay} onChange={(e) => update('barangay', e.target.value)} aria-label="Barangay" required />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader icon={MdOutlineBadge} title="Officials" subtitle="Printed under the signature lines" />
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Punong Barangay" hint="Printed under Punong Barangay/Lupon Chairman">
                <Input value={form.punong_barangay} onChange={(e) => update('punong_barangay', e.target.value)} placeholder="Full name" aria-label="Punong Barangay" />
              </Field>
              <Field label="Barangay Secretary">
                <Input value={form.secretary} onChange={(e) => update('secretary', e.target.value)} placeholder="Full name" aria-label="Barangay Secretary" />
              </Field>
            </div>
          </Card>

          <div>
            <Button type="submit" icon={MdOutlineSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save settings'}
            </Button>
          </div>
        </form>
      )}
    </AdminLayout>
  )
}

export default AdminSettings
