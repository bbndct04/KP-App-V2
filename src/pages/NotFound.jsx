import { MdOutlineSearchOff, MdArrowBack } from 'react-icons/md'
import { EmptyState, LinkButton } from '../components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <EmptyState
        icon={MdOutlineSearchOff}
        title="Page not found"
        message="The page you're looking for doesn't exist or has been moved."
        action={<LinkButton to="/" icon={MdArrowBack}>Back to home</LinkButton>}
      />
    </div>
  )
}
