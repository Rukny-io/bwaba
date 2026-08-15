import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--border)] py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 min-[720px]:flex-row min-[720px]:items-center min-[720px]:justify-between min-[720px]:px-6">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">ركني Business</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            صندوق وارد موحّد لـ Instagram و Messenger
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-[var(--muted-foreground)]">
          <Link href="/login" className="hover:text-[var(--foreground)]">
            تسجيل الدخول
          </Link>
          <Link href="/privacy" className="hover:text-[var(--foreground)]">
            الخصوصية
          </Link>
          <Link href="/terms" className="hover:text-[var(--foreground)]">
            الشروط
          </Link>
        </div>
      </div>
    </footer>
  );
}
