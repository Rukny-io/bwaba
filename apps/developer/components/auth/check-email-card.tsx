'use client';

import { useEffect, useState } from 'react';
import { Button } from '@heroui/react';
import { cn } from '@/lib/utils';

interface CheckEmailCardProps {
  email: string;
  onResend: () => Promise<void>;
  onTryOtherMethod: () => void;
  className?: string;
}

export function CheckEmailCard({
  email,
  onResend,
  onTryOtherMethod,
  className,
}: CheckEmailCardProps) {
  const RESEND_DELAY = 60;
  const [countdown, setCountdown] = useState(RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    try {
      await onResend();
      setResendSuccess(true);
      setCanResend(false);
      setCountdown(RESEND_DELAY);
      setTimeout(() => setResendSuccess(false), 3000);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={cn('w-full text-center', className)}>
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-[var(--surface-secondary)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-7 text-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
          />
        </svg>
      </div>

      <h1 className="mb-2 text-2xl font-semibold text-foreground">
        تحقق من بريدك
      </h1>

      <p className="mb-1 text-sm text-muted-foreground">
        أرسلنا رابط تسجيل الدخول إلى
      </p>
      <p className="mb-8 break-all text-sm font-medium text-foreground">
        {email}
      </p>

      <div className="space-y-3">
        {resendSuccess ? (
          <p className="text-sm font-medium text-[var(--success)]">
            ✓ تم إرسال الرابط مجدداً
          </p>
        ) : canResend ? (
          <Button
            variant="ghost"
            size="sm"
            onPress={handleResend}
            isDisabled={isResending}
            className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
          >
            {isResending ? 'جارٍ الإرسال...' : 'إعادة إرسال الرابط'}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            إعادة الإرسال خلال {countdown} ثانية
          </p>
        )}

        <div>
          <button
            type="button"
            onClick={onTryOtherMethod}
            className="cursor-pointer text-sm text-muted-foreground underline underline-offset-3 transition-colors hover:text-foreground"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  );
}
