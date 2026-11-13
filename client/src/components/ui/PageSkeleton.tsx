/** Placeholder shown while a code-split screen loads. Mirrors the page header + cards layout. */
export default function PageSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse">
      {!compact && (
        <div className="mb-6 space-y-2">
          <div className="h-3 w-24 rounded bg-zinc-200" />
          <div className="h-7 w-64 max-w-full rounded bg-zinc-200" />
          <div className="h-4 w-96 max-w-full rounded bg-zinc-100" />
        </div>
      )}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: compact ? 2 : 4 }).map((_, i) => (
          <div key={i} className="card h-24" />
        ))}
      </div>
      <div className="card h-72" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
