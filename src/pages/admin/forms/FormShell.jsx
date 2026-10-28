export function FormSkeleton() {
  const line = 'animate-pulse bg-gray-200 rounded h-3'
  return (
    <div role="status" aria-label="Loading document" className="min-h-screen bg-gray-200 py-8">
      <div className="max-w-[800px] mx-auto bg-white p-10 border border-black">
        <div className="flex flex-col items-center gap-2.5 mb-10">
          <div className={`${line} w-56`} />
          <div className={`${line} w-40`} />
          <div className={`${line} w-64`} />
          <div className={`${line} w-48`} />
        </div>
        <div className="flex flex-col gap-3">
          {[100, 95, 100, 90, 100, 70].map((w, i) => (
            <div key={i} className={line} style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="flex flex-col gap-3 mt-10">
          {[100, 85, 100, 60].map((w, i) => (
            <div key={i} className={line} style={{ width: `${w}%` }} />
          ))}
        </div>
        <span className="sr-only">Loading document…</span>
      </div>
    </div>
  )
}
