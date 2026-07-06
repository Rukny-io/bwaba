export default function FormCreatingLoading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-4 py-24">
      <div className="size-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--foreground)]" />
      <p className="mt-4 text-sm text-[var(--muted-foreground)]">
        جاري تحميل النموذج…
      </p>
    </div>
  );
}
