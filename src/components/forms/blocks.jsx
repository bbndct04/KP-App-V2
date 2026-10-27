import { useLayoutEffect, useRef } from 'react'
import { useDoc } from '../../context/docContext'
import { dateParts } from '../../lib/formsKit'

const PLAIN =
  typeof document !== 'undefined' &&
  (() => {
    const el = document.createElement('span')
    el.contentEditable = 'plaintext-only'
    return el.contentEditable === 'plaintext-only'
  })()

function Editable({ value, onCommit, label, placeholder, block = false, className = '' }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (el && document.activeElement !== el && el.innerText !== (value || '')) el.innerText = value || ''
  }, [value])

  const Tag = block ? 'div' : 'span'
  return (
    <Tag
      ref={ref}
      role="textbox"
      aria-label={label}
      aria-multiline={block || undefined}
      tabIndex={0}
      contentEditable={PLAIN ? 'plaintext-only' : true}
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={`kp-ed ${block ? 'kp-ed-block' : ''} ${className}`}
      onBlur={(e) => onCommit(e.currentTarget.innerText.replace(/\u00A0/g, ' ').replace(/\n+$/, ''))}
      onKeyDown={(e) => {
        if (!block && e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      onPaste={
        PLAIN
          ? undefined
          : (e) => {
              e.preventDefault()
              document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
            }
      }
    />
  )
}

export function T({ k, label, placeholder, underline = false, bold = false, blank = true, minCh = 10 }) {
  const { fields, set, edit } = useDoc()
  const value = fields[k] ?? ''
  const cls = [underline && 'kp-u', bold && 'kp-bold'].filter(Boolean).join(' ')
  if (edit) {
    return <Editable value={value} onCommit={(v) => set(k, v)} label={label || k} placeholder={placeholder || label || k} className={underline ? 'kp-ed-u' : ''} />
  }
  if (!value) return blank ? <span className="kp-u" style={{ minWidth: `${minCh}ch` }}>&nbsp;</span> : null
  return <span className={cls}>{value}</span>
}

export function D({ k, label }) {
  const { fields, set, edit } = useDoc()
  const iso = fields[k] ?? ''
  if (edit) {
    return <input type="date" aria-label={label || k} value={iso} onChange={(e) => set(k, e.target.value)} className="kp-date" />
  }
  const p = dateParts(iso)
  return (
    <>
      <span className="kp-u" style={{ minWidth: '4ch' }}>{p ? p.day : '\u00A0'}</span> day of{' '}
      <span className="kp-u" style={{ minWidth: '11ch' }}>{p ? p.month : '\u00A0'}</span>,{' '}
      <span className="kp-u" style={{ minWidth: '5ch' }}>{p ? p.year : '\u00A0'}</span>
    </>
  )
}

export function Ruled({ k, label, lines = 3 }) {
  const { fields, set, edit } = useDoc()
  const value = fields[k] ?? ''
  const style = { minHeight: `${lines * 28}px` }
  return (
    <div className="kp-ruled" style={style}>
      {edit ? <Editable block value={value} onCommit={(v) => set(k, v)} label={label} placeholder={`Type: ${label}`} /> : value}
    </div>
  )
}

export function OfficeHeader() {
  return (
    <div className="kp-center">
      <div>Republic of the Philippines</div>
      <div>
        Province of <T k="province" label="Province" />
      </div>
      <div>
        <T k="localityType" label="City or Municipality" minCh={5} /> of <T k="locality" label="City or municipality name" />
      </div>
      <div>
        Barangay <T k="barangay" label="Barangay" />
      </div>
      <div className="kp-bold" style={{ marginTop: 4 }}>
        OFFICE OF THE LUPONG TAGAPAMAYAPA
      </div>
    </div>
  )
}

export function PartyCaption() {
  return (
    <div className="kp-caption">
      <div>
        <div className="kp-name">
          <T k="complainant" label="Complainant name" blank={false} />
        </div>
        <div className="kp-label">Complainant/s</div>
        <div className="kp-center kp-against">— against —</div>
        <div className="kp-name">
          <T k="respondent" label="Respondent name" blank={false} />
        </div>
        <div className="kp-label">Respondent/s</div>
      </div>
      <div>
        <div>
          Barangay Case No.: <T k="caseNo" label="Barangay case number" bold />
        </div>
        <div style={{ marginTop: 6 }}>
          For: <T k="forWhat" label="Nature of the case" underline />
        </div>
      </div>
    </div>
  )
}

export function FormTitle({ children }) {
  return <div className="kp-title">{children}</div>
}

export function Para({ children, bold = false }) {
  return <p className={`kp-para ${bold ? 'kp-bold' : ''}`}>{children}</p>
}

export function Sig({ label, nameKey, nameLabel, width = 260 }) {
  return (
    <div className="kp-sig" style={{ width }}>
      <div className="kp-sig-line" />
      {nameKey && (
        <div className="kp-sig-name">
          <T k={nameKey} label={nameLabel} blank={false} />
        </div>
      )}
      <div className="kp-sig-label">{label}</div>
    </div>
  )
}
