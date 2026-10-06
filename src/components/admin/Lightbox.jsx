import { useEffect } from 'react'
import { MdClose } from 'react-icons/md'

function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[65] bg-black/80 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={alt}>
      <button
        onClick={onClose}
        aria-label="Close image"
        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
      >
        <MdClose className="text-2xl" aria-hidden="true" />
      </button>
      <img src={src} alt={alt} className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
    </div>
  )
}

export default Lightbox
