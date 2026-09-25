import Link from 'next/link';

export default function ProfileNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="max-w-sm text-center">
        <h1 className="text-6xl font-bold text-[var(--foreground)]">404</h1>
        <p className="mt-3 text-lg font-semibold text-[var(--foreground)]">الملف غير موجود</p>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          لم نعثر على هذه الصفحة. قد يكون اسم المستخدم غير صحيح أو الملف خاصاً.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-white"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
