'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@heroui/react';
import { AuthLoadingCard } from '@/components/auth/auth-status-card';
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

    const callback = new URL('/callback', window.location.origin);
    callback.searchParams.set('code', code);
    if (hashNext) callback.searchParams.set('next', hashNext);
    else if (searchParams.get('next')) {
      callback.searchParams.set('next', searchParams.get('next')!);
    }
    clearOAuthParamsFromUrl();
    router.replace(callback.pathname + callback.search);
  }, [router, searchParams]);

  return (
    <AuthShell>
      <div className="w-full rounded-[1.75rem] bg-[var(--surface)] p-6 sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            مرحباً بك في Business
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
            {sessionFlag === 'expired'
              ? 'انتهت جلستك. سجّل الدخول للمتابعة.'
              : 'صندوق وارد موحّد لمحادثات Instagram و Messenger'}
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Button
            className="h-11 w-full rounded-full bg-[var(--foreground)] text-[var(--background)]"
            onPress={() => {
              window.location.href = getGoogleOAuthUrl(nextPath);
            }}
          >
            <GoogleIcon />
            <span className="ms-2">المتابعة بحساب Google</span>
          </Button>

          <Button
            variant="secondary"
            className="h-11 w-full rounded-full"
            onPress={() => {
              window.location.href = getAccountsLoginUrl(nextPath);
            }}
          >
            تسجيل الدخول بحساب ركني
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <AuthLoadingCard title="جارٍ التحميل" description="لحظة من فضلك…" />
        </AuthShell>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
