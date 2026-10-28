import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    const isChunkError = /dynamically imported module|Loading chunk/i.test(this.state.error.message)

    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-ink text-xl font-bold mb-2">
            {isChunkError ? 'A new version is available' : 'Something went wrong'}
          </h1>
          <p className="text-ink-faint text-sm mb-6">
            {isChunkError
              ? 'KP App was updated. Reload to get the latest version.'
              : 'An unexpected error occurred. Reloading usually fixes it. If it keeps happening, please contact the barangay.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-accent text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
