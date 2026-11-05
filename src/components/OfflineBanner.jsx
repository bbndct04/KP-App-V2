import { useEffect, useState } from 'react'
import { MdOutlineCloudOff } from 'react-icons/md'
import { useT } from '../i18n/LanguageContext'

function OfflineBanner() {
  const { t } = useT()
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (!offline) return null
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-warning-soft text-warning-strong border-b border-warning-strong/20 px-4 py-2 text-sm font-medium text-center">
      <MdOutlineCloudOff className="text-lg flex-shrink-0" aria-hidden="true" />
      {t("You're offline. Showing your last saved information.")}
    </div>
  )
}

export default OfflineBanner
