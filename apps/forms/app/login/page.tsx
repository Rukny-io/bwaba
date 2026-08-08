'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@heroui/react';
import { AuthShell } from '@/components/auth/auth-shell';
import {
  getAccountsLoginUrl,
  getGoogleOAuthUrl,
  resolveClientNext,
} from '@/lib/auth-redirect';
import { clearOAuthParamsFromUrl, readOAuthCallbackParams } from '@/lib/oauth-callback';

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
    () => resolveClientNext(searchParams.get('next'), '/app'),
    [searchParams],
  );
  const sessionFlag = searchParams.get('session');

  useEffect(() => {
    const { code, next: hashNext } = readOAuthCallbackParams(searchParams);
    if (!code) return;

    // Move code into /callback query once, then clear it from /login.
    const callback = new URL('/callback', window.location.origin);
    callback.searchParams.set('code', code);
    if (hashNext) callback.searchParams.set('next', hashNext);
    else if (searchParams.get('next')) {
      callback.searchParams.set('next', searchParams.get('next')!);
    }
    clearOAuthParamsFromUrl();
    router.replace(callback.pathname + callback.search);
  }, [router, searchParams]);

  const sessionMessage =
    sessionFlag === 'expired'
      ? 'انتهت جلستك. سجّل الدخول مرة أخرى.'
      : sessionFlag === 'logout'
        ? 'تم تسجيل الخروج بنجاح.'
        : null;

  return (
    <AuthShell className="max-w-[460px]">
      <section className="w-full bg-[var(--background)]/95 px-5 py-6 sm:px-7 sm:py-8">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-blue-soft)] px-4 py-2 text-xs font-medium text-[var(--secondary-foreground)]">
            أهلاً بك
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            تسجيل الدخول
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
            أنشئ النماذج وأدر الاستجابات من مكان واحد
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

          <Button
            className="h-11 w-full rounded-full text-sm font-semibold transition-all bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95"
            onPress={() => {
              window.location.href = getAccountsLoginUrl(nextPath);
            }}
          >
            تسجيل الدخول عبر ركني
          </Button>

          <div className="my-5 flex w-full items-center gap-3">
            <span className="h-[1px] flex-1 bg-[var(--border)]" />
            <span className="shrink-0 text-xs text-[var(--muted-foreground)]">أو</span>
            <span className="h-[1px] flex-1 bg-[var(--border)]" />
          </div>

          <Button
            variant="outline"
            className="h-11 w-full flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-medium transition-all hover:bg-[var(--accent)]/10 hover:border-[var(--border)]"
            onPress={() => {
              window.location.href = getGoogleOAuthUrl(nextPath);
            }}
          >
            <GoogleIcon />
            تسجيل دخول سريع بـ Google
          </Button>

          <p className="text-xs text-[var(--muted-foreground)] text-center leading-relaxed pt-2">
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
          <div className="w-full text-center py-12">
            <div className="size-10 mx-auto rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
            <p className="text-sm text-[var(--muted-foreground)] mt-4">جارٍ التحميل...</p>
          </div>
        </AuthShell>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
