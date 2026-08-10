'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { exchangeCodeOnce, fetchCurrentUser } from '@/lib/api';
import { resolveClientNext } from '@/lib/auth-redirect';
import {
  clearOAuthParamsFromUrl,
  clearStashedOAuthParams,
  readOAuthCallbackParams,
  readStashedOAuthParams,
  stashOAuthParams,
} from '@/lib/oauth-callback';

import { resolveAccountsUrl } from '@rukny/auth/client/env-urls';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const fromUrl = readOAuthCallbackParams(searchParams);
    if (fromUrl.code) {
      stashOAuthParams({ code: fromUrl.code, next: fromUrl.next });
      clearOAuthParamsFromUrl();
    }

    const stashed = readStashedOAuthParams();
    const code = fromUrl.code || stashed.code;
    const nextRaw = fromUrl.next || stashed.next;

    if (!code) {
      hasRun.current = false;
      router.replace('/login');
      return;
    }

    const nextPath = resolveClientNext(nextRaw, '/app');

    (async () => {
      try {
        const result = await exchangeCodeOnce(code);
        clearStashedOAuthParams();

        if (!result.success) {
          setError(result.message || 'Could not complete sign-in');
          return;
        }

        if (result.needsProfileCompletion) {
          const accountsUrl = resolveAccountsUrl();
          const complete = new URL('/complete-profile', accountsUrl);
          complete.searchParams.set('next', `${window.location.origin}${nextPath}`);
          window.location.href = complete.toString();
          return;
        }

        if (result.requires2FA && result.pendingSessionId) {
          const accountsUrl = resolveAccountsUrl();
          const verify = new URL('/verify-2fa', accountsUrl);
          verify.searchParams.set('sessionId', result.pendingSessionId);
          window.location.href = verify.toString();
          return;
        }

        const user = await fetchCurrentUser();
        if (user?.role !== 'ADMIN') {
          router.replace('/forbidden');
          return;
        }

        if (user) {
          window.location.replace(nextPath);
          return;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 150));
        const retryUser = await fetchCurrentUser();
        if (retryUser?.role === 'ADMIN') {
          window.location.replace(nextPath);
          return;
        }

        setError('Signed in but the session was not saved. Please try again.');
      } catch (err: unknown) {
        const existing = await fetchCurrentUser();
        if (existing?.role === 'ADMIN') {
          clearStashedOAuthParams();
          window.location.replace(nextPath);
          return;
        }

        const apiError = err as {
          message?: string;
          data?: { message?: string | string[] };
        };
        const raw =
          apiError.data?.message ??
          apiError.message ??
          'An error occurred during sign-in';
        const message = Array.isArray(raw) ? raw[0] : raw;
        setError(message);
      }
    })();
  }, [router, searchParams]);

  if (error) {
    return (
      <AuthShell>
        <section className="w-full dashboard-card rounded-2xl px-5 py-6 text-center">
          <h1 className="text-xl font-bold mb-4">Sign-in failed</h1>
          <p className="text-sm text-[var(--danger)] mb-4">{error}</p>
          <button
            type="button"
            className="text-sm font-medium underline"
            onClick={() => {
              clearStashedOAuthParams();
              router.replace('/login');
            }}
          >
            Back to sign in
          </button>
        </section>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <section className="w-full dashboard-card rounded-2xl px-5 py-6 text-center">
        <h1 className="text-xl font-bold mb-4">Signing in</h1>
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="size-10 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--muted-foreground)]">
            Verifying admin permissions...
          </p>
        </div>
      </section>
    </AuthShell>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <section className="w-full dashboard-card rounded-2xl px-5 py-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
          </section>
        </AuthShell>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
