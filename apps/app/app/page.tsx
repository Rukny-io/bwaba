import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeJwt } from 'jose';
import { AUTH_COOKIE_NAMES } from '@/lib/auth-cookies';
import { DEFAULT_APP_PATH } from '@/lib/auth-redirect';

async function hasValidSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value ||
    cookieStore.get('access_token')?.value;

  if (!token) return false;

  try {
    const payload = decodeJwt(token);
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default async function HomePage() {
  if (await hasValidSession()) {
    redirect(DEFAULT_APP_PATH);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
          <p className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
            ركني
          </p>
          <Link
            href="/login"
            className="rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-[11px] font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            تسجيل الدخول
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        <h1 className="max-w-xl text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          صفحتك الشخصية وروابطك في مكان واحد
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
          أنشئ صفحة link-in-bio احترافية، أدر روابطك، وشارك نماذجك مع جمهورك على منصة ركني.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-95"
          >
            ابدأ الآن
          </Link>
        </div>
      </main>
    </div>
  );
}
