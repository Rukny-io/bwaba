'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@heroui/react';
import { OTPInput } from '@/components/auth/otp-input';
import { verify2FA, ApiError } from '@/lib/api/auth';
import { useAuth } from '@/providers/auth-provider';

function Verify2FAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  const sessionId = searchParams.get('sessionId') || '';
  const method = (searchParams.get('method') as 'authenticator' | 'recovery') || 'authenticator';

  const [code, setCode] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setError(null);

    if (code.length !== 6) {
      setError('أدخل الرمز المكوّن من 6 أرقام.');
      return;
    }

    if (!sessionId) {
      setError('جلسة غير صالحة. ارجع وأعد المحاولة.');
      return;
    }

    setIsPending(true);
    try {
      const result = await verify2FA({ pendingSessionId: sessionId, token: code });
      if (result.user) {
        setUser(result.user);
      }
      router.push('/app');
    } catch (err) {
      setCode('');
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 400) {
          setError('الرمز غير صحيح أو منتهي الصلاحية. أعد المحاولة.');
        } else if (err.isRateLimited) {
          setError('محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.');
        } else {
          setError(err.message || 'حدث خطأ. أعد المحاولة.');
        }
      } else {
        setError('تعذر الاتصال بالخادم.');
      }
    } finally {
      setIsPending(false);
    }
  };

  const methodLabel =
    method === 'recovery' ? 'رمز الاسترداد' : 'تطبيق المصادقة';

  return (
    <div className="w-full py-6" dir="rtl">
      <h1 className="text-center text-[34px] sm:text-[40px] leading-[1.15] font-light text-zinc-900 dark:text-zinc-100 mb-2">
        التحقق بخطوتين
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-7">
        أدخل الرمز من {methodLabel}
      </p>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-red-600 dark:text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex justify-center mb-7">
        <OTPInput
          value={code}
          onChange={setCode}
          isDisabled={isPending}
          autoFocus
        />
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleVerify}
          disabled={isPending || code.length !== 6}
          className="flex items-center justify-center gap-2 h-[48px] w-full bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-zinc-900 text-[14px] rounded-full font-semibold transition-all"
        >
          {isPending ? (
            <>
              <Spinner size="sm" className="text-white dark:text-zinc-900" />
              <span>جاري التحقق...</span>
            </>
          ) : (
            <span>تحقق</span>
          )}
        </button>

        <a
          href="/verify-identity"
          className="flex items-center justify-center h-[48px] w-full rounded-full border border-zinc-200 dark:border-zinc-700 text-[14px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
        >
          جرّب طريقة أخرى
        </a>
      </div>
    </div>
  );
}

export default function Verify2FAPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="text-zinc-400" />
      </div>
    }>
      <Verify2FAContent />
    </Suspense>
  );
}

