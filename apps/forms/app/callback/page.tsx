'use client';

import { Suspense, useEffect, useState } from 'react';
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

const ACCOUNTS_URL =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'http://localhost:3005';

/** Survives React Strict Mode remounts within the same document load. */
let callbackBootstrapped = false;

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (callbackBootstrapped) return;
    callbackBootstrapped = true;

    const fromUrl = readOAuthCallbackParams(searchParams);
    if (fromUrl.code) {
      stashOAuthParams({ code: fromUrl.code, next: fromUrl.next });
      clearOAuthParamsFromUrl();
    }

    const stashed = readStashedOAuthParams();
    const code = fromUrl.code || stashed.code;
    const nextRaw = fromUrl.next || stashed.next;

    if (!code) {
      callbackBootstrapped = false;
      router.replace('/login');
      return;
    }

    const nextPath = resolveClientNext(nextRaw, '/app');

    (async () => {
      try {
        const result = await exchangeCodeOnce(code);
        clearStashedOAuthParams();

        if (!result.success) {
          setError(result.message || 'تعذر إكمال تسجيل الدخول');
          return;
        }

        if (result.needsProfileCompletion) {
          const complete = new URL('/complete-profile', ACCOUNTS_URL);
          complete.searchParams.set(
            'next',
            `${window.location.origin}${nextPath}`,
          );
          window.location.href = complete.toString();
          return;
        }

        if (result.requires2FA && result.pendingSessionId) {
          const verify = new URL('/verify-2fa', ACCOUNTS_URL);
          verify.searchParams.set('sessionId', result.pendingSessionId);
          window.location.href = verify.toString();
          return;
        }

        const user = await fetchCurrentUser();
        if (user) {
          window.location.replace(nextPath);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 150));
        const retryUser = await fetchCurrentUser();
        if (retryUser) {
          window.location.replace(nextPath);
          return;
        }

        setError('تم تسجيل الدخول لكن الجلسة لم تُحفظ. أعد المحاولة.');
      } catch (err: unknown) {
        const existing = await fetchCurrentUser();
        if (existing) {
          clearStashedOAuthParams();
          window.location.replace(nextPath);
          return;
        }

        const message =
          err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول';
        setError(message);
      }
    })();
  }, [router, searchParams]);

  if (error) {
    return (
      <AuthShell>
        <section className="w-full bg-[var(--background)]/95 px-5 py-6 sm:px-7 sm:py-8 shadow-sm border border-[var(--border)] rounded-2xl flex flex-col items-center text-center">
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)] mb-4">
            تعذر تسجيل الدخول
          </h1>
          <p className="text-sm text-[var(--danger)] text-center mb-4">{error}</p>
          <button
            type="button"
            className="text-sm font-medium text-[var(--foreground)] underline w-full text-center transition-opacity hover:opacity-80"
            onClick={() => {
              clearStashedOAuthParams();
              router.replace('/login');
            }}
          >
            العودة لتسجيل الدخول
          </button>
        </section>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <section className="w-full bg-[var(--background)]/95 px-5 py-6 sm:px-7 sm:py-8 shadow-sm border border-[var(--border)] rounded-2xl flex flex-col items-center text-center">
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)] mb-4">
          جارٍ تسجيل الدخول
        </h1>
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="size-10 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--muted-foreground)]">
            يتم التحقق من جلستك...
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
          <section className="w-full bg-[var(--background)]/95 px-5 py-6 sm:px-7 sm:py-8 shadow-sm border border-[var(--border)] rounded-2xl flex flex-col items-center text-center">
            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)] mb-4">
              جارٍ التحميل
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] text-center">
              ...
            </p>
          </section>
        </AuthShell>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
