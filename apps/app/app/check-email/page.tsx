'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';
import { resendMagicLink } from '@/lib/api';
import { cn } from '@/lib/utils';

const RESEND_DELAY = 60;

function CheckEmailContent() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('auth_email');
    if (!storedEmail) {
      router.replace('/login');
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (!canResend || isResending || !email) return;
    setIsResending(true);
    try {
      await resendMagicLink(email);
      setResendSuccess(true);
      setCanResend(false);
      setCountdown(RESEND_DELAY);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch {
      /* ignore */
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;

  return (
    <AuthShell>
      <div className="w-full text-center">
        <h1 className="text-[1.75rem] font-medium leading-tight text-[#1D1D1D]">
          تحقق من بريدك
        </h1>
        <p className="mt-3 text-[1rem] leading-[1.5] text-[#6B6F76]">
          أرسلنا رمز الدخول إلى بريدك. افتح الرابط لمتابعة تسجيل الدخول.
        </p>

        <div className="mt-8 space-y-5">
          <div className="space-y-2">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">
              أُرسل إلى
            </p>
            <div
              className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] px-4 py-3.5"
              dir="ltr"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[#6B6F76] ring-1 ring-[#E8E8E8]"
                aria-hidden
              >
                <Mail className="size-4" />
              </span>
              <span
                className="min-w-0 flex-1 truncate text-left text-[15px] font-medium text-[#1D1D1D]"
                title={email}
              >
                {email}
              </span>
            </div>
          </div>

          {resendSuccess ? (
            <p
              className="rounded-xl bg-[#ECFDF3] px-3 py-2 text-sm text-[#166534]"
              role="status"
            >
              تم إرسال الرمز مجدداً
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || isResending}
            className={cn(
              'inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#F5F5F5] px-6 text-[14px] font-medium text-[#1D1D1D] transition-colors hover:bg-[#EBEBEB] disabled:opacity-45',
            )}
          >
            {isResending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                جارٍ الإرسال...
              </>
            ) : canResend ? (
              <>
                <RefreshCw className="size-4" aria-hidden />
                إعادة إرسال الرمز
              </>
            ) : (
              `إعادة الإرسال خلال ${countdown} ثانية`
            )}
          </button>

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-sm text-[#6B6F76] transition-colors hover:text-[#1D1D1D] hover:underline"
          >
            جرّب طريقة أخرى
          </button>
        </div>
      </div>
    </AuthShell>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <div className="w-full py-12 text-center">
            <div className="mx-auto size-10 animate-spin rounded-full border-2 border-[#1D1D1D] border-t-transparent" />
          </div>
        </AuthShell>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
