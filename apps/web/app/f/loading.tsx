export default function PublicFormLoading() {
  return (
    <div className="public-form-loading flex min-h-dvh items-start justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-xl animate-pulse">
        <div className="mb-8 h-40 w-full rounded-2xl bg-[var(--surface-secondary)] sm:mb-10 sm:h-48" />
        <div className="mb-3 h-9 w-3/4 rounded-lg bg-[var(--surface-secondary)]" />
        <div className="mb-8 h-4 w-full max-w-md rounded-md bg-[var(--surface-secondary)]" />
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-1/3 rounded-md bg-[var(--surface-secondary)]" />
            <div className="h-11 w-full rounded-xl bg-[var(--surface-secondary)]" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-2/5 rounded-md bg-[var(--surface-secondary)]" />
            <div className="h-11 w-full rounded-xl bg-[var(--surface-secondary)]" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-1/4 rounded-md bg-[var(--surface-secondary)]" />
            <div className="h-24 w-full rounded-xl bg-[var(--surface-secondary)]" />
          </div>
          <div className="pt-4">
            <div className="h-11 w-36 rounded-full bg-[var(--surface-secondary)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
