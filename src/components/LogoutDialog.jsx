import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n/LanguageContext'
import { clearIdle } from '../lib/useIdleLogout'
import { ConfirmDialog } from './ui'

function LogoutDialog({ open, onCancel }) {
  const { signOut } = useAuth()
  const { t } = useT()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    clearIdle()
    await signOut()
    setBusy(false)
    navigate('/login')
  }

  return (
    <ConfirmDialog
      open={open}
      tone="primary"
      title={t('Log out?')}
      message={t('You will need to enter your email and password again to use the app.')}
      confirmLabel={t('Log out')}
      cancelLabel={t('Cancel')}
      loading={busy}
      onConfirm={confirm}
      onCancel={onCancel}
    />
  )
}

export default LogoutDialog
