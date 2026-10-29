import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdArrowBack, MdOutlinePrint } from 'react-icons/md'
import { DocContext } from '../../context/docContext'
import { PAPER, MARGIN_PX } from '../../lib/formsKit'
import { Button, Select } from '../ui'
import { FORM_CSS } from './formStyles'

function readPaper() {
  try {
    return localStorage.getItem('kp-paper') || 'legal'
  } catch {
    return 'legal'
  }
}

function PrintShell({ title, docTitle, backTo, backLabel = 'Back', fields, notice, actions, children }) {
  const navigate = useNavigate()
  const [paperKey, setPaperKey] = useState(readPaper)
  const paper = PAPER[paperKey] || PAPER.legal
  const wrap = useRef(null)
  const inner = useRef(null)
  const [fit, setFit] = useState({ scale: 1, height: 0 })

  useEffect(() => {
    const measure = () => {
      if (!wrap.current || !inner.current) return
      setFit({ scale: Math.min(1, wrap.current.clientWidth / paper.w), height: inner.current.offsetHeight })
    }
    const ro = new ResizeObserver(measure)
    if (wrap.current) ro.observe(wrap.current)
    if (inner.current) ro.observe(inner.current)
    return () => ro.disconnect()
  }, [paper.w])

  useEffect(() => {
    if (!docTitle) return
    const previous = document.title
    document.title = docTitle
    return () => {
      document.title = previous
    }
  }, [docTitle])

  function changePaper(v) {
    setPaperKey(v)
    try {
      localStorage.setItem('kp-paper', v)
    } catch {
      /* storage unavailable */
    }
  }

  return (
    <DocContext.Provider value={{ fields, set: () => {}, edit: false }}>
      <style>{`${FORM_CSS}@page{size:${paper.css};margin:0.75in}`}</style>
      <div className="kp-page-bg min-h-screen bg-bg py-5 px-3 sm:px-5">
        <div className="kp-noprint max-w-[1000px] mx-auto mb-4">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <Button variant="ghost" size="sm" icon={MdArrowBack} onClick={() => navigate(backTo)}>
              {backLabel}
            </Button>
            <div className="text-ink text-base font-bold">{title}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={paperKey} onChange={(e) => changePaper(e.target.value)} aria-label="Paper size" className="w-auto min-w-[170px] py-2">
              {Object.entries(PAPER).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.label}
                </option>
              ))}
            </Select>
            {actions}
            <div className="flex-1" />
            <Button icon={MdOutlinePrint} onClick={() => window.print()}>
              Print
            </Button>
          </div>
          {notice}
        </div>

        <div ref={wrap} className="kp-fit-wrap max-w-[1000px] mx-auto" style={{ height: fit.height ? fit.height * fit.scale : undefined }}>
          <div ref={inner} className="kp-fit" style={{ width: paper.w, transform: `scale(${fit.scale})`, transformOrigin: 'top left', margin: fit.scale < 1 ? 0 : '0 auto' }}>
            <div className="kp-paper border border-black/20" style={{ padding: MARGIN_PX * 0.75, minHeight: paper.h }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </DocContext.Provider>
  )
}

export default PrintShell
