import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--background)] px-6 py-16">
      <Image
        src="/rukny-logo.svg"
        alt="Rukny"
        width={48}
        height={48}
        className="mb-6"
        priority
      />
      <h1 className="text-center text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        Rukny Workspace
      </h1>
      <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-[var(--muted-foreground)]">
        بريد إلكتروني احترافي باسم دومينك — متكامل مع متجرك ونماذجك على
        منصة ركني.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/app"
          className="inline-flex h-11 items-center justify-center rounded-3xl bg-[var(--foreground)] px-6 text-sm font-medium text-[var(--background)]"
        >
          فتح لوحة التحكم
        </Link>
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-3xl border border-[var(--border)] px-6 text-sm font-medium text-[var(--foreground)]"
        >
          تسجيل الدخول
        </Link>
      </div>
    </div>
  );
}
