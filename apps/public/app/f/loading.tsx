export default function PublicFormLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4 animate-pulse">
        <div className="h-8 w-3/4 rounded-lg bg-[var(--surface-secondary)]" />
        <div className="h-4 w-full rounded-md bg-[var(--surface-secondary)]" />
        <div className="h-4 w-5/6 rounded-md bg-[var(--surface-secondary)]" />
        <div className="mt-8 space-y-3">
          <div className="h-11 w-full rounded-xl bg-[var(--surface-secondary)]" />
          <div className="h-11 w-full rounded-xl bg-[var(--surface-secondary)]" />
          <div className="h-11 w-2/3 rounded-full bg-[var(--surface-secondary)]" />
        </div>
      </div>
    </div>
  );
}
