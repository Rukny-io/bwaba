'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@heroui/react';
import { AuthError } from './auth-alert';
import { OAuthButtons } from './oauth-buttons';
import { requestQuickSign, ApiError } from '@/lib/api/auth';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('أدخل بريدك الإلكتروني.');
      return;
    }

    setIsPending(true);
    try {
      await requestQuickSign(trimmed);
      router.push(`/check-email?email=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isRateLimited) {
          setError('طلبات كثيرة. انتظر دقيقة ثم أعد المحاولة.');
        } else {
          setError(err.message || 'حدث خطأ. أعد المحاولة.');
        }
      } else {
        setError('تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.');
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full" dir="rtl">
      <h1 className="text-center text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-2 leading-tight">
        تسجيل الدخول إلى ركني
      </h1>
      <p className="text-center text-[13px] text-zinc-500 dark:text-zinc-400 mb-6">
        أدخل بريدك الإلكتروني للمتابعة
      </p>

      <AuthError message={error} />

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-[48px] px-4 text-[14px] border border-zinc-200 dark:border-zinc-700 rounded-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400/20 transition-all text-center"
          placeholder="البريد الإلكتروني"
          required
          disabled={isPending}
          autoComplete="email"
          autoFocus
          dir="ltr"
        />

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 h-[48px] w-full bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 active:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-zinc-900 text-[14px] rounded-full font-semibold transition-all"
        >
          {isPending ? (
            <>
              <Spinner size="sm" className="text-white dark:text-zinc-900" />
              <span>جاري الإرسال...</span>
            </>
          ) : (
            <span>المتابعة</span>
          )}
        </button>
      </form>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium whitespace-nowrap">أو</span>
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
      </div>

      <OAuthButtons />

      <div className="mt-8 pt-5 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
          <a href="/terms" className="text-zinc-500 dark:text-zinc-400 hover:underline">شروط الخدمة</a>
          <span className="mx-2">|</span>
          <a href="/privacy" className="text-zinc-500 dark:text-zinc-400 hover:underline">سياسة الخصوصية</a>
        </p>
      </div>
    </div>
  );
}
