'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { exchangeCode, fetchCurrentUser } from '@/lib/api';
import { resolveClientNext } from '@/lib/auth-redirect';

const ACCOUNTS_URL =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'http://localhost:3005';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = searchParams.get('code');
    if (!code) {
      router.replace('/login');
      return;
    }

    const nextPath = resolveClientNext(searchParams.get('next'), '/app');

    (async () => {
      try {
        const result = await exchangeCode(code);
        if (!result.success) {
          setError(result.message || 'Could not complete sign-in');
          return;
        }

        const user = await fetchCurrentUser();
        if (user?.role !== 'ADMIN') {
          router.replace('/forbidden');
          return;
        }

        if (result.needsProfileCompletion) {
          const complete = new URL('/complete-profile', ACCOUNTS_URL);
          complete.searchParams.set('next', `${window.location.origin}${nextPath}`);
          window.location.href = complete.toString();
          return;
        }

        if (result.requires2FA && result.pendingSessionId) {
          const verify = new URL('/verify-2fa', ACCOUNTS_URL);
          verify.searchParams.set('sessionId', result.pendingSessionId);
          window.location.href = verify.toString();
          return;
        }

        router.replace(nextPath);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'An error occurred during sign-in';
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
            onClick={() => router.replace('/login')}
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
