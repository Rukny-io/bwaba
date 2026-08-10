'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthErrorCard, AuthLoadingCard } from '@/components/auth/auth-status-card';
import { AuthShell } from '@/components/auth/auth-shell';
import { exchangeCodeOnce, fetchCurrentUser } from '@/lib/api';
import { formatAuthError } from '@/lib/auth-error-messages';
import { resolveClientNext } from '@/lib/auth-redirect';
import { resolveAccountsUrl } from '@/lib/dev-urls';
import {
  clearOAuthParamsFromUrl,
  clearStashedOAuthParams,
  readOAuthCallbackParams,
  readStashedOAuthParams,
  stashOAuthParams,
} from '@/lib/oauth-callback';

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
          setError(result.message || 'تعذر إكمال تسجيل الدخول');
          return;
        }

        if (result.needsProfileCompletion) {
          const complete = new URL('/complete-profile', resolveAccountsUrl());
          complete.searchParams.set(
            'next',
            `${window.location.origin}${nextPath}`,
          );
          window.location.href = complete.toString();
          return;
        }

        if (result.requires2FA && result.pendingSessionId) {
          const verify = new URL('/verify-2fa', resolveAccountsUrl());
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

        const apiError = err as { message?: string; data?: { message?: string | string[] } };
        const raw =
          apiError.data?.message ??
          apiError.message ??
          'حدث خطأ أثناء تسجيل الدخول';
        const message = Array.isArray(raw) ? raw[0] : raw;
        setError(message);
      }
    })();
  }, [router, searchParams]);

  if (error) {
    const copy = formatAuthError(error);

    return (
      <AuthShell className="max-w-[460px]">
        <AuthErrorCard
          title={copy.title}
          description={copy.description}
          onAction={() => {
            clearStashedOAuthParams();
            router.replace('/login');
          }}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell className="max-w-[460px]">
      <AuthLoadingCard />
    </AuthShell>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthShell className="max-w-[460px]">
          <AuthLoadingCard title="جارٍ التحميل" description="لحظة من فضلك…" />
        </AuthShell>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
