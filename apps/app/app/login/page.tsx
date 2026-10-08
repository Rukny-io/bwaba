'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';
import { GoogleIcon } from '@/components/auth/provider-icons';
import { requestMagicLink } from '@/lib/api';
import {
  DEFAULT_APP_PATH,
  getAccountsLoginUrl,
  getGoogleOAuthUrl,
  resolveClientNext,
} from '@/lib/auth-redirect';
import {
  clearOAuthParamsFromUrl,
  readOAuthCallbackParams,
  stashOAuthParams,
} from '@/lib/oauth-callback';
import { cn } from '@/lib/utils';

const oauthButtonClass =
  'inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-[#E8E8E8] bg-white px-4 text-[14px] font-medium text-[#1D1D1D] transition-colors hover:bg-[#FAFAFA]';

const fieldShellClass =
  'flex h-11 items-center gap-2.5 overflow-hidden rounded-full border border-[#E8E8E8] bg-white px-3 transition-colors focus-within:border-[#1D1D1D]/25 focus-within:ring-2 focus-within:ring-[#1D1D1D]/8';

const inputClass =
  'h-full min-w-0 flex-1 border-0 bg-transparent text-left text-sm text-[#1D1D1D] outline-none placeholder:text-[#9CA3AF]';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(
    () => resolveClientNext(searchParams.get('next'), DEFAULT_APP_PATH),
    [searchParams],
  );
  const sessionFlag = searchParams.get('session');

  const trimmedEmail = email.trim();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

  useEffect(() => {
    const fromUrl = readOAuthCallbackParams(searchParams);
    if (!fromUrl.code) return;

    stashOAuthParams({ code: fromUrl.code, next: fromUrl.next });
    clearOAuthParamsFromUrl();

    const callback = new URL('/callback', window.location.origin);
    callback.searchParams.set('code', fromUrl.code);
    const nextTarget =
      fromUrl.next ||
      searchParams.get('next') ||
      (nextPath !== DEFAULT_APP_PATH ? nextPath : null);
    if (nextTarget) callback.searchParams.set('next', nextTarget);
    router.replace(callback.pathname + callback.search);
  }, [router, searchParams, nextPath]);

  const sessionMessage =
    sessionFlag === 'expired'
      ? 'انتهت جلستك. سجّل الدخول مرة أخرى.'
      : sessionFlag === 'logout'
        ? 'تم تسجيل الخروج بنجاح.'
        : null;

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail || isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      await requestMagicLink(trimmedEmail);
      sessionStorage.setItem('auth_email', trimmedEmail);
      if (nextPath) localStorage.setItem('auth_next', nextPath);
      router.push('/check-email');
    } catch (err: unknown) {
      const apiError = err as {
        status?: number;
        data?: { message?: string };
        message?: string;
      };
      setError(
        apiError.data?.message ||
          apiError.message ||
          'تعذّر إرسال رمز الدخول. حاول مرة أخرى.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="w-full text-center">
        <h1 className="text-[1.75rem] font-medium leading-tight tracking-[0em] text-[#1D1D1D]">
          تسجيل الدخول
        </h1>
        <p className="mt-3 text-[1rem] font-normal leading-[1.5] text-[#6B6F76]">
          أدر روابطك وصفحتك الشخصية من مكان واحد
        </p>

        <div className="mt-8 flex flex-col gap-2.5">
          {sessionMessage ? (
            <p
              className="rounded-2xl bg-[#F5F5F5] px-3 py-2 text-[13px] leading-relaxed text-[#6B6F76]"
              role="status"
            >
              {sessionMessage}
            </p>
          ) : null}

          <button
            type="button"
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1D1D1D] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#0A0A0A]"
            onClick={() => {
              window.location.href = getAccountsLoginUrl(nextPath);
            }}
          >
            تسجيل الدخول بواسطة ركني
          </button>

          <button
            type="button"
            className={oauthButtonClass}
            onClick={() => {
              window.location.href = getGoogleOAuthUrl(nextPath);
            }}
          >
            <GoogleIcon />
            المتابعة عبر Google
          </button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#E8E8E8]" />
          <span className="shrink-0 text-xs text-[#9CA3AF]">
            أو البريد الإلكتروني
          </span>
          <div className="h-px flex-1 bg-[#E8E8E8]" />
        </div>

        <form onSubmit={handleMagicLinkSubmit} className="w-full space-y-4" noValidate>
          <div className={fieldShellClass}>
            <Mail className="size-4 shrink-0 text-[#9CA3AF]" aria-hidden />
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              autoComplete="email"
              autoFocus
              aria-invalid={!!error}
              className={inputClass}
              dir="ltr"
            />
          </div>

          {error ? (
            <p
              className="rounded-xl bg-[#FEE2E2]/70 px-3 py-2 text-xs text-[#B91C1C]"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!isValidEmail || isLoading}
            className={cn(
              'inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1D1D1D] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#0A0A0A] disabled:opacity-45',
            )}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                جارٍ الإرسال...
              </span>
            ) : (
              'إرسال رمز الدخول'
            )}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <div className="w-full py-12 text-center">
            <div className="mx-auto size-10 animate-spin rounded-full border-2 border-[#1D1D1D] border-t-transparent" />
            <p className="mt-4 text-[13px] text-[#9CA3AF]">جارٍ التحميل...</p>
          </div>
        </AuthShell>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
