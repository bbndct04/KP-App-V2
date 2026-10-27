import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/toastContext'

export function useCaseDocument(formNo, title, makeDefaults) {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const toast = useToast()
  const key = `${id}|${formNo}`
  const [state, setState] = useState({ key: null, complaint: null, settings: null, docs: [], active: null })
  const [fields, setFields] = useState({})
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)

  const fetchAll = useCallback(async () => {
    const [{ data: complaint }, { data: settings }, { data: docs }] = await Promise.all([
      supabase.from('complaints').select('*').eq('id', id).maybeSingle(),
      supabase.from('barangay_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('case_documents').select('*').eq('complaint_id', id).eq('form_no', formNo).order('version', { ascending: false }),
    ])
    const list = docs || []
    const active = list.find((d) => d.status !== 'void') || null
    const base = makeDefaults(complaint, settings || {})
    let initial = base
    if (active) initial = active.status === 'draft' ? { ...base, ...active.fields } : { ...active.fields }
    return { complaint, settings, list, active, initial }
  }, [id, formNo, makeDefaults])

  const apply = useCallback(
    (r) => {
      setState({ key, complaint: r.complaint, settings: r.settings, docs: r.list, active: r.active })
      setFields(r.initial)
      setDirty(false)
    },
    [key]
  )

  useEffect(() => {
    let cancelled = false
    async function run() {
      const r = await fetchAll()
      if (!cancelled) apply(r)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [fetchAll, apply])

  const load = useCallback(async () => apply(await fetchAll()), [fetchAll, apply])

  const set = useCallback((k, v) => {
    setFields((f) => ({ ...f, [k]: v }))
    setDirty(true)
  }, [])

  const save = useCallback(async () => {
    setBusy(true)
    const now = new Date().toISOString()
    const common = { fields, form_title: title, updated_by: user.id, updated_at: now }
    let res
    if (state.active && state.active.status === 'draft') {
      res = await supabase.from('case_documents').update(common).eq('id', state.active.id).select().single()
    } else {
      res = await supabase
        .from('case_documents')
        .insert({
          ...common,
          complaint_id: Number(id),
          form_no: formNo,
          version: (state.docs[0]?.version || 0) + 1,
          status: 'draft',
          created_by: user.id,
          created_by_name: profile?.full_name || null,
        })
        .select()
        .single()
    }
    setBusy(false)
    if (res.error) {
      toast.error(`The form could not be saved. ${res.error.message}`)
      return null
    }
    setState((s) => ({ ...s, active: res.data, docs: [res.data, ...s.docs.filter((d) => d.id !== res.data.id)] }))
    setDirty(false)
    return res.data
  }, [fields, title, user, profile, state.active, state.docs, id, formNo, toast])

  const saveDraft = useCallback(async () => {
    const saved = await save()
    if (saved) toast.success('Draft saved.')
    return saved
  }, [save, toast])

  const issue = useCallback(async () => {
    let doc = state.active
    if (!doc || doc.status !== 'draft' || dirty) {
      doc = await save()
      if (!doc) return false
    }
    setBusy(true)
    const { error } = await supabase.rpc('issue_document', { p_document_id: doc.id })
    setBusy(false)
    if (error) {
      toast.error(`The form could not be issued. ${error.message}`)
      return false
    }
    await load()
    toast.success(`Form ${formNo} was issued and recorded in the case log.`)
    return true
  }, [state.active, dirty, save, load, toast, formNo])

  const voidAndReissue = useCallback(
    async (reason) => {
      setBusy(true)
      const { error } = await supabase.rpc('void_and_reissue', { p_document_id: state.active.id, p_reason: reason })
      setBusy(false)
      if (error) {
        toast.error(`The form could not be voided. ${error.message}`)
        return false
      }
      await load()
      toast.success('The form was voided. A new draft is ready to edit.')
      return true
    },
    [state.active, load, toast]
  )

  return useMemo(
    () => ({
      ready: state.key === key,
      complaint: state.complaint,
      settings: state.settings,
      docs: state.docs,
      active: state.active,
      status: state.active ? state.active.status : 'new',
      fields,
      set,
      dirty,
      busy,
      saveDraft,
      issue,
      voidAndReissue,
    }),
    [state, key, fields, set, dirty, busy, saveDraft, issue, voidAndReissue]
  )
}
