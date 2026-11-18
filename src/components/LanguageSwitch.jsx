import { useT } from '../i18n/LanguageContext'

const OPTIONS = [
  ['en', 'English', 'EN'],
  ['tl', 'Filipino', 'FIL'],
]

export default function LanguageSwitch({ className = '' }) {
  const { lang, setLanguage } = useT()
  return (
    <div role="group" aria-label="Language" className={`inline-flex rounded-full border border-border p-0.5 text-xs font-semibold ${className}`}>
      {OPTIONS.map(([value, label, short]) => (
        <button
          key={value}
          type="button"
          aria-pressed={lang === value}
          aria-label={label}
          onClick={() => lang !== value && setLanguage(value)}
          className={`rounded-full px-2.5 py-1.5 transition-colors ${lang === value ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'}`}
        >
          <span className="sm:hidden">{short}</span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
