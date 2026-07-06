export default function UserDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-28 animate-pulse rounded-lg bg-[var(--surface-secondary)]" />
      <div className="flex items-center gap-4">
        <div className="size-14 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-[var(--surface-secondary)]" />
          <div className="h-4 w-56 animate-pulse rounded-lg bg-[var(--surface-secondary)]" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-2xl bg-[var(--surface-secondary)] sm:rounded-3xl"
          />
        ))}
      </div>
    </div>
  );
}
