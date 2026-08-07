export default function FormCreatingLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-3 py-16 sm:px-4">
      <div className="form-create-document space-y-4 p-4 sm:p-6">
        <div className="h-8 w-2/3 animate-pulse rounded-full bg-[var(--surface-secondary)]" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-[var(--surface-secondary)]" />
        <div className="mt-6 space-y-3 border-t border-[var(--border)]/60 pt-6">
          <div className="h-24 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />
          <div className="h-24 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        جاري تحميل النموذج…
      </p>
    </div>
  );
}
