import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'

function Form7() {
  const { id } = useParams()
  const navigate = useNavigate()
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

  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!complaint) return <div className="p-10 text-center">Complaint not found.</div>

  const dateObj = new Date(complaint.created_at)
  const day = dateObj.toLocaleDateString('en-US', { day: '2-digit' })
  const month = dateObj.toLocaleDateString('en-US', { month: 'long' })
  const year = dateObj.getFullYear()

  return (
    <div className="min-h-screen bg-gray-200 py-8 print:bg-white print:py-0">
      {/* Toolbar — hidden when printing */}
      <div className="max-w-[800px] mx-auto mb-4 flex justify-between items-center print:hidden">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-600 border border-gray-300 rounded-md px-4 py-2 bg-white">
          ‹ Back
        </button>
        <button onClick={() => window.print()} className="text-sm font-semibold text-white bg-blue-600 rounded-md px-5 py-2">
          🖨️ Print / Save as PDF
        </button>
      </div>

      {/* Printable Document */}
      <div className="max-w-[800px] mx-auto bg-white p-10 text-black font-sans text-[12px] border border-black print:border-0 print:shadow-none shadow-lg">
        <div className="text-center mb-5 leading-relaxed">
          Republic of the Philippines<br />
          Province of Zambales<br />
          CITY/MUNICIPALITY OF Olongapo<br />
          Barangay New Kababae<br />
          OFFICE OF THE LUPONG TAGAPAMAYAPA
        </div>

        <table className="w-full mb-4">
          <tbody>
            <tr>
              <td className="w-1/2 align-top">
                <div className="border-b border-black w-[180px] h-4" />
                <div className="border-b border-black w-[180px] h-4 mb-1" />
                <div className="text-center text-[11px]">Complainant/s</div>
                <br />— against —<br /><br />
                <div className="border-b border-black w-[180px] h-4" />
                <div className="border-b border-black w-[180px] h-4 mb-1" />
                <div className="text-center text-[11px]">Respondent/s</div>
              </td>
              <td className="w-1/2 align-top">
                Barangay Case No.: <strong>{complaint.reference_number}</strong><br />
                For: <strong>{complaint.category}</strong><br /><br />
                {complaint.complainant_name}<br /><br /><br /><br />
                {complaint.respondent_name}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="font-bold text-[13px] uppercase text-center my-4 tracking-widest">C O M P L A I N T</div>

        <div className="text-justify leading-loose">
          I/WE hereby complain against above named respondent/s for violating my/our
          rights and interests in the following manner:
        </div>

        <div className="my-4">
          <div className="border-b border-black mb-1">&nbsp;</div>
          <div className="border-b border-black mb-1">&nbsp;</div>
          <div className="border-b border-black mb-1">&nbsp;</div>
          {complaint.description}
        </div>

        <div className="text-justify leading-loose">
          THEREFORE, I/WE pray that the following relief/s be granted to me/us in
          accordance with law and/or equity:
        </div>

        <div className="my-4">
          <div className="border-b border-black mb-1">&nbsp;</div>
          <div className="border-b border-black mb-1">&nbsp;</div>
          {complaint.relief_requested}
        </div>

        <div>
          Made this <u>{day}</u> day of <u>{month}</u>, <u>{year}</u>.
        </div>

        <div className="mt-5">
          <div className="border-b border-black w-[220px] mb-1">&nbsp;</div>
          <div>Complainant/s</div>
          <br />
          Received and filed this <u>{day}</u> day of <u>{month}</u>, <u>{year}</u>.
          <br /><br />
          <div className="border-b border-black w-[220px] mb-1">&nbsp;</div>
          <div>Punong Barangay/Lupon Chairman</div>
        </div>
      </div>
    </div>
  )
}

export default Form7