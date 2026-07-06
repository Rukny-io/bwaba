'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@heroui/react';
import { AuthShell } from '@/components/auth/auth-shell';
import {
  getAccountsLoginUrl,
  getGoogleOAuthUrl,
  resolveClientNext,
} from '@/lib/auth-redirect';

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
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => resolveClientNext(searchParams.get('next'), '/app'),
    [searchParams],
  );
  const sessionFlag = searchParams.get('session');

  const sessionMessage =
    sessionFlag === 'expired'
      ? 'Your session has expired. Please sign in again.'
      : sessionFlag === 'logout'
        ? 'You have been signed out successfully.'
        : null;

  return (
    <AuthShell className="max-w-[460px]">
      <section className="w-full dashboard-card rounded-2xl px-5 py-6 sm:px-7 sm:py-8">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-secondary)] px-4 py-2 text-xs font-medium">
            Platform admins only
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
            HQ control panel for managing the Rukny platform
          </p>
        </div>

        <div className="w-full space-y-4">
          {sessionMessage ? (
            <p
              className="rounded-2xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-3 py-2 text-xs text-center"
              role="status"
            >
              {sessionMessage}
            </p>
          ) : null}

          <Button
            className="h-11 w-full rounded-full text-sm font-semibold"
            onPress={() => {
              window.location.href = getAccountsLoginUrl(nextPath);
            }}
          >
            Sign in with Rukny
          </Button>

          <div className="my-5 flex w-full items-center gap-3">
            <span className="h-px flex-1 bg-[var(--border)]" />
            <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
              or
            </span>
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <Button
            variant="outline"
            className="h-11 w-full flex items-center justify-center gap-2 rounded-full"
            onPress={() => {
              window.location.href = getGoogleOAuthUrl(nextPath);
            }}
          >
            <GoogleIcon />
            Google
          </Button>
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
          </div>
        </AuthShell>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
