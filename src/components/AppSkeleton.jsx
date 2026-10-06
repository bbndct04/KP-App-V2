import { Skeleton } from './ui'

function AppSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="h-app flex bg-bg overflow-hidden">
      <aside className="hidden md:flex w-[260px] flex-shrink-0 flex-col gap-2.5 bg-surface border-r border-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-11 w-full rounded-xl" />
        ))}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex-shrink-0 bg-surface border-b border-border flex items-center gap-3 px-4 md:px-7">
          <Skeleton className="h-6 w-40" />
          <div className="flex-1" />
          <Skeleton className="w-9 h-9 rounded-full" />
        </header>

        <main className="flex-1 p-4 md:p-7 flex flex-col gap-4 overflow-hidden">
          <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
          <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        </main>

        <div className="md:hidden flex-shrink-0 h-16 bg-surface border-t border-border" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export default AppSkeleton
