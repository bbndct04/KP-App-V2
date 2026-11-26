import { useEffect, useState } from 'react'
import { MdOutlineAutoAwesome, MdCheckCircle } from 'react-icons/md'
import { classify, loadModel } from '../lib/classifier'
import { useT } from '../i18n/LanguageContext'

const MIN_LENGTH = 20
const MIN_CONFIDENCE = 0.35

function useCategorySuggestion(text) {
  const [suggestion, setSuggestion] = useState(null)

  useEffect(() => {
    const value = (text || '').trim()
    let cancelled = false
    const timer = setTimeout(
      async () => {
        if (value.length < MIN_LENGTH) {
          if (!cancelled) setSuggestion(null)
          return
        }
        const model = await loadModel()
        if (cancelled) return
        const top = classify(model, value)[0]
        setSuggestion(top && top.probability >= MIN_CONFIDENCE ? top : null)
      },
      value.length < MIN_LENGTH ? 0 : 400
    )
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [text])

  return suggestion
}

export default function CategorySuggestion({ text, value, onUse, className = '' }) {
  const { t } = useT()
  const suggestion = useCategorySuggestion(text)
  if (!suggestion) return null

  const p = suggestion.probability
  const confidence = p >= 0.8 ? t('High confidence') : p >= 0.55 ? t('Medium confidence') : t('Low confidence')
  const matches = value === suggestion.category

  return (
    <div
      role="status"
      className={`${className} flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3.5 py-3 ${
        matches ? 'bg-success-soft border-success-strong/25' : 'bg-accent-soft border-accent/25'
      }`}
    >
      {matches ? (
        <MdCheckCircle className="text-xl text-success-strong flex-shrink-0" aria-hidden="true" />
      ) : (
        <MdOutlineAutoAwesome className="text-xl text-accent flex-shrink-0" aria-hidden="true" />
      )}
      <div className="flex-1 min-w-[180px]">
        <div className="text-xs text-ink-soft">{matches ? t('Matches the suggested nature of complaint') : t('Suggested nature of complaint')}</div>
        <div className="text-sm font-semibold text-ink">
          {t(suggestion.category)} <span className="font-normal text-ink-soft">· {confidence}</span>
        </div>
      </div>
      {!matches && (
        <button
          type="button"
          onClick={() => onUse(suggestion.category)}
          className="text-sm font-semibold text-accent-ink bg-accent hover:opacity-90 rounded-lg px-3 py-1.5"
        >
          {t('Use this')}
        </button>
      )}
      <div className="basis-full text-xs text-ink-faint">{t('Suggested by the KP App from the statement of facts. You can still choose another category.')}</div>
    </div>
  )
}
