'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@heroui/react';
import { MailIcon, RefreshIcon } from '@/components/auth/icons';
import { requestQuickSign, ApiError } from '@/lib/api/auth';

function CheckEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // إعادة التوجيه إذا لم يكن هناك بريد
  useEffect(() => {
    if (!email) router.replace('/login');
  }, [email, router]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (!canResend || isSending || !email) return;
    setError(null);
    setSent(false);
    setIsSending(true);
    try {
      await requestQuickSign(email);
      setSent(true);
      setCanResend(false);
      setCountdown(60);
    } catch (err) {
      if (err instanceof ApiError && err.isRateLimited) {
        setError('طلبات كثيرة. انتظر دقيقة ثم أعد المحاولة.');
      } else {
        setError('تعذر إعادة الإرسال. أعد المحاولة.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleTryAnotherMethod = () => {
    const q = new URLSearchParams();
    if (email) q.set('email', email);
    router.push(`/verify-identity?${q.toString()}`);
  };

  if (!email) {
    return (
      <div className="w-full py-16 flex items-center justify-center">
        <Spinner className="text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="w-full py-10" dir="rtl">
      <div className="flex flex-col items-center w-full">
        
        <div className="text-center mb-7">
          <h1 className="text-4xl font-light tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
            تحقق من بريدك
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
            أرسلنا رابط تسجيل الدخول إلى
          </p>
          <p className="text-base font-medium text-zinc-900 dark:text-zinc-100" dir="ltr">
            {email}
          </p>
        </div>

        <div className="w-full space-y-4 mb-5">
          <div className="text-center p-4 bg-zinc-100/70 dark:bg-zinc-800/60 rounded-3xl">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              اضغط على الرابط في بريدك لتسجيل الدخول
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
              الرابط صالح لمدة 10 دقائق فقط
            </p>
          </div>

          {sent && (
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-green-700 dark:text-green-400 text-sm text-center">
              أعدنا إرسال رابط الدخول إلى بريدك بنجاح.
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={handleResend}
            disabled={!canResend || isSending}
            className="flex items-center justify-center gap-2 w-full h-[48px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Spinner size="sm" />
                <span>جاري الإرسال...</span>
              </>
            ) : !canResend ? (
              <span className="text-[14px]">إعادة الإرسال ({countdown})</span>
            ) : (
              <>
                <RefreshIcon className="h-4 w-4" />
                <span className="text-[14px]">إعادة إرسال الرابط</span>
              </>
            )}
          </button>

          <button
            onClick={() => router.push('/login')}
            className="flex items-center justify-center gap-2 w-full h-[48px] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-full transition-all hover:bg-zinc-800 dark:hover:bg-zinc-100 text-[14px]"
          >
            تغيير البريد الإلكتروني
          </button>
          <button
            onClick={handleTryAnotherMethod}
            className="flex items-center justify-center gap-2 w-full h-[40px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 text-[15px] font-medium rounded-full transition-all duration-300"
          >
            <span>جرّب طريقة أخرى</span>
          </button>
        </div>

        <div className="mt-8 pt-5 border-t border-zinc-100 dark:border-zinc-800 w-full">
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
            <a href="/terms" className="hover:underline">شروط الخدمة</a>
            <span className="mx-2">|</span>
            <a href="/privacy" className="hover:underline">سياسة الخصوصية</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <div className="w-full py-16 flex items-center justify-center">
        <Spinner className="text-zinc-400" />
      </div>
    }>
      <CheckEmailContent />
    </Suspense>
  );
}
