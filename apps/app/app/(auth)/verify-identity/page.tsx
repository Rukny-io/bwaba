'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@heroui/react';
import { ShieldIcon, KeyRoundIcon, MailIcon } from '@/components/auth/icons';
import { startVerifyIdentity, ApiError } from '@/lib/api/auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function VerifyIdentityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email') || '';
  const sessionId = searchParams.get('sessionId') || '';
  const hasValidSessionId = useMemo(() => UUID_REGEX.test(sessionId), [sessionId]);

  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<'authenticator' | 'recovery' | null>(null);

  const getOrCreateSessionId = async (): Promise<string | null> => {
    if (hasValidSessionId) return sessionId;

    if (!email) {
      setError('لا يوجد بريد مرتبط بهذه المحاولة. ارجع إلى تسجيل الدخول.');
      return null;
    }

    try {
      const result = await startVerifyIdentity(email);
      if (!result.pendingSessionId) {
        setError('لا يمكن استخدام هذه الطريقة لهذا الحساب. جرّب البريد الإلكتروني.');
        return null;
      }
      return result.pendingSessionId;
    } catch (err) {
      if (err instanceof ApiError && err.isRateLimited) {
        setError('طلبات كثيرة. انتظر دقيقة ثم أعد المحاولة.');
      } else {
        setError('تعذر استخدام هذه الطريقة الآن. جرّب البريد الإلكتروني.');
      }
      return null;
    }
  };

  const goToAuthenticator = async () => {
    setError(null);
    setIsStarting('authenticator');
    try {
      const sid = await getOrCreateSessionId();
      if (!sid) return;
      router.push(`/verify-2fa?sessionId=${encodeURIComponent(sid)}&method=authenticator`);
    } finally {
      setIsStarting(null);
    }
  };

  const goToRecovery = async () => {
    setError(null);
    setIsStarting('recovery');
    try {
      const sid = await getOrCreateSessionId();
      if (!sid) return;
      router.push(`/verify-2fa?sessionId=${encodeURIComponent(sid)}&method=recovery`);
    } finally {
      setIsStarting(null);
    }
  };

  const goToEmail = () => {
    const q = new URLSearchParams();
    if (email) q.set('email', email);
    router.push(`/check-email?${q.toString()}`);
  };

  const isLoading = isStarting !== null;

  return (
    <div className="w-full py-6" dir="rtl">
      <h1 className="text-center text-[34px] sm:text-[40px] leading-[1.15] font-light text-zinc-900 dark:text-zinc-100 mb-8">
        اختر طريقة
        <br />
        للتحقق من هويتك
      </h1>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-red-600 dark:text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={goToAuthenticator}
          disabled={isLoading}
          className="w-full h-[62px] rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 transition-colors px-6 flex items-center gap-3 text-right hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isStarting === 'authenticator' ? (
            <Spinner size="sm" className="text-zinc-700 dark:text-zinc-200" />
          ) : (
            <ShieldIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
          )}
          <span className="text-[17px] font-medium text-zinc-900 dark:text-zinc-100">
            تطبيق المصادقة
          </span>
        </button>

        <button
          type="button"
          onClick={goToRecovery}
          disabled={isLoading}
          className="w-full h-[62px] rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 transition-colors px-6 flex items-center gap-3 text-right hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isStarting === 'recovery' ? (
            <Spinner size="sm" className="text-zinc-700 dark:text-zinc-200" />
          ) : (
            <KeyRoundIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
          )}
          <span className="text-[17px] font-medium text-zinc-900 dark:text-zinc-100">رمز الاسترداد</span>
        </button>

        <button
          type="button"
          onClick={goToEmail}
          disabled={isLoading}
          className="w-full h-[62px] rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors px-6 flex items-center gap-3 text-right disabled:opacity-70"
        >
          <MailIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
          <span className="text-[17px] font-medium text-zinc-900 dark:text-zinc-100">البريد الإلكتروني</span>
        </button>
      </div>

      <div className="mt-8 text-center text-sm text-zinc-500">
        <a href="/terms" className="hover:underline">شروط الاستخدام</a>
        <span className="mx-3">|</span>
        <a href="/privacy" className="hover:underline">سياسة الخصوصية</a>
      </div>
    </div>
  );
}

export default function VerifyIdentityPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="text-zinc-400" />
      </div>
    }>
      <VerifyIdentityContent />
    </Suspense>
  );
}
