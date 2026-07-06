'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { exchangeCode } from '@/lib/api';
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

    const storedNext = localStorage.getItem('auth_next');
    const nextPath = resolveClientNext(
      searchParams.get('next') ?? storedNext,
      '/apps',
    );

    (async () => {
      try {
        const result = await exchangeCode(code);
        if (!result.success) {
          setError(result.message || 'تعذّر إكمال تسجيل الدخول');
          return;
        }

        localStorage.removeItem('auth_next');

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

        router.replace(nextPath);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول';
        setError(message);
      }
    })();
  }, [router, searchParams]);

  if (error) {
    return (
      <AuthShell>
        <section className="w-full px-5 py-6 text-center">
          <h1 className="mb-4 text-xl font-bold">فشل تسجيل الدخول</h1>
          <p className="mb-4 text-sm text-[var(--danger)]">{error}</p>
          <button
            type="button"
            className="text-sm font-medium underline"
            onClick={() => router.replace('/login')}
          >
            العودة لتسجيل الدخول
          </button>
        </section>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <section className="w-full px-5 py-6 text-center">
        <h1 className="mb-4 text-xl font-bold">جاري تسجيل الدخول</h1>
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="size-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          <p className="text-sm text-[var(--muted-foreground)]">
            جاري التحقق من حسابك...
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
          <section className="w-full px-5 py-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">جاري التحميل...</p>
          </section>
        </AuthShell>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
