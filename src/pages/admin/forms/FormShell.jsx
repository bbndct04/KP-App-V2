import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'

export function useComplaintForForm() {
  const { id } = useParams()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('complaints').select('*').eq('id', id).single()
      setComplaint(data)
      setLoading(false)
    }
    load()
  }, [id])

  return { complaint, loading }
}

export function fmtDate(dateStr, part) {
  if (!dateStr) return part === 'day' ? '____' : part === 'month' ? '________' : '19__'
  const d = new Date(dateStr)
  if (part === 'day') return d.toLocaleDateString('en-US', { day: '2-digit' })
  if (part === 'month') return d.toLocaleDateString('en-US', { month: 'long' })
  return d.getFullYear()
}

export function fmtTime(timeStr) {
  if (!timeStr) return '______'
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${m}`
}

export function FormPage({ title, children }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-200 py-8 print:bg-white print:py-0">
      <div className="max-w-[800px] mx-auto mb-4 flex justify-between items-center print:hidden">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-600 border border-gray-300 rounded-md px-4 py-2 bg-white">
          ‹ Back
        </button>
        <button onClick={() => window.print()} className="text-sm font-semibold text-white bg-blue-600 rounded-md px-5 py-2">
          🖨️ Print / Save as PDF
        </button>
      </div>
      <div className="max-w-[800px] mx-auto bg-white p-10 text-black font-sans text-[12px] border border-black print:border-0 print:shadow-none shadow-lg">
        {children}
      </div>
    </div>
  )
}

export function FormHeader({ office = 'OFFICE OF THE LUPONG TAGAPAMAYAPA' }) {
  return (
    <div className="text-center mb-5 leading-relaxed">
      Republic of the Philippines<br />
      Province of Zambales<br />
      CITY/MUNICIPALITY OF Olongapo<br />
      Barangay New Kababae<br />
      {office}
    </div>
  )
}

export function PartiesTable({ complaint }) {
  return (
    <table className="w-full mb-4">
      <tbody>
        <tr>
          <td className="w-1/2 align-top">
            <div className="border-b border-black w-[180px] h-4" />
            <div className="text-center text-[11px]">Complainant/s</div>
            <br />— against —<br /><br />
            <div className="border-b border-black w-[180px] h-4" />
            <div className="text-center text-[11px]">Respondent/s</div>
          </td>
          <td className="w-1/2 align-top">
            Barangay Case No.: <strong>{complaint.reference_number}</strong><br />
            For: <strong>{complaint.category}</strong><br /><br />
            {complaint.complainant_name}<br /><br /><br />
            {complaint.respondent_name}
          </td>
        </tr>
      </tbody>
    </table>
  )
}