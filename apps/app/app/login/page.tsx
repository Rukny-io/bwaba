'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import {
  DEFAULT_APP_PATH,
  getAccountsLoginUrl,
  getGoogleOAuthUrl,
  resolveClientNext,
} from '@/lib/auth-redirect';
import {
  clearOAuthParamsFromUrl,
  readOAuthCallbackParams,
  stashOAuthParams,
} from '@/lib/oauth-callback';

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => resolveClientNext(searchParams.get('next'), DEFAULT_APP_PATH),
    [searchParams],
  );
  const sessionFlag = searchParams.get('session');

  useEffect(() => {
    const fromUrl = readOAuthCallbackParams(searchParams);
    if (!fromUrl.code) return;

    stashOAuthParams({ code: fromUrl.code, next: fromUrl.next });
    clearOAuthParamsFromUrl();

    const callback = new URL('/callback', window.location.origin);
    callback.searchParams.set('code', fromUrl.code);
    const nextTarget =
      fromUrl.next ||
      searchParams.get('next') ||
      (nextPath !== DEFAULT_APP_PATH ? nextPath : null);
    if (nextTarget) callback.searchParams.set('next', nextTarget);
    router.replace(callback.pathname + callback.search);
  }, [router, searchParams, nextPath]);

  const sessionMessage =
    sessionFlag === 'expired'
      ? 'انتهت جلستك. سجّل الدخول مرة أخرى.'
      : sessionFlag === 'logout'
        ? 'تم تسجيل الخروج بنجاح.'
        : null;

  return (
    <AuthShell className="max-w-[460px]">
      <section className="w-full px-5 py-6 sm:px-7 sm:py-8">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--secondary)] px-4 py-2 text-xs font-medium text-[var(--secondary-foreground)]">
            أهلاً بك
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            تسجيل الدخول
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
            أدر روابطك وصفحتك الشخصية من مكان واحد
          </p>
        </div>

        <div className="w-full space-y-4">
          {sessionMessage ? (
            <p
              className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 text-center"
              role="status"
            >
              {sessionMessage}
            </p>
          ) : null}

          <button
            type="button"
            className="h-11 w-full rounded-full bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-95"
            onClick={() => {
              window.location.href = getAccountsLoginUrl(nextPath);
            }}
          >
            تسجيل الدخول عبر ركني
          </button>

          <div className="my-5 flex w-full items-center gap-3">
            <span className="h-px flex-1 bg-[var(--border)]" />
            <span className="shrink-0 text-xs text-[var(--muted-foreground)]">أو</span>
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <button
            type="button"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-medium transition-colors hover:bg-[var(--surface-secondary)]"
            onClick={() => {
              window.location.href = getGoogleOAuthUrl(nextPath);
            }}
          >
            <GoogleIcon />
            تسجيل دخول سريع بـ Google
          </button>

          <p className="pt-2 text-center text-xs leading-relaxed text-[var(--muted-foreground)]">
            بتسجيل الدخول عبر Google يُنشأ حسابك في منصة ركني إن لم يكن موجوداً مسبقاً.
          </p>
        </div>
      </section>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <div className="w-full py-12 text-center">
            <div className="mx-auto size-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">جارٍ التحميل...</p>
          </div>
        </AuthShell>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
