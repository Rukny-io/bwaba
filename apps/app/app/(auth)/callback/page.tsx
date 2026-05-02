'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@heroui/react';
import { exchangeOAuthCode, ApiError } from '@/lib/api/auth';
import { useAuth } from '@/providers/auth-provider';

/**
 * صفحة callback لـ OAuth.
 * تستدعي exchange endpoint وتحدد التوجيه بناءً على النتيجة:
 * - نجح + يحتاج profile  → /complete-profile
 * - نجح + يحتاج 2FA      → /verify-identity?sessionId=...&email=...
 * - نجح                  → /app
 * - فشل                  → /login?error=...
 */
function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setPendingProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      router.replace('/login?error=missing_code');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const result = await exchangeOAuthCode(code);

        if (cancelled) return;

        if (result.requiresLinking) {
          router.replace('/login?error=account_linking_required');
          return;
        }

        if (result.requires2FA && result.pendingSessionId) {
          const q = new URLSearchParams({ sessionId: result.pendingSessionId });
          router.replace(`/verify-identity?${q.toString()}`);
          return;
        }

        if (result.needsProfileCompletion) {
          setPendingProfile();
          // Generate a one-time token for the complete-profile flow
          const buf = new Uint8Array(16);
          crypto.getRandomValues(buf);
          const cpToken = Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
          sessionStorage.setItem(`cp_token_${cpToken}`, 'active');
          router.replace(`/complete-profile/${cpToken}`);
          return;
        }

        if (result.user) {
          setUser(result.user);
        }
        router.replace('/app');
      } catch (err) {
        if (cancelled) return;
        let msg = 'auth_error';
        if (err instanceof ApiError) {
          msg = err.status === 400 ? 'invalid_code' : 'auth_error';
          setError(err.message || 'حدث خطأ أثناء تسجيل الدخول.');
        } else {
          setError('تعذر الاتصال بالخادم. أعد المحاولة.');
        }
        setTimeout(() => {
          if (!cancelled) router.replace(`/login?error=${msg}`);
        }, 3000);
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="w-full py-10 flex flex-col items-center gap-4" dir="rtl">
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-red-600 dark:text-red-400 text-sm text-center w-full">
          {error}
        </div>
        <p className="text-sm text-center text-zinc-500">جارٍ التوجيه...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-4 py-16">
      <Spinner className="text-zinc-400" />
      <p className="text-sm text-zinc-500">جارٍ تسجيل الدخول...</p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="w-full flex flex-col items-center gap-4 py-16">
        <Spinner className="text-zinc-400" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
