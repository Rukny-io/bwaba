'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Languages } from 'lucide-react';
import { Button } from '@heroui/react';
import { useLocale } from '@/lib/i18n/locale';
import { cn } from '@/lib/utils';

interface CheckoutShellProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  /** Content rendered above the page title (e.g. invoice card) */
  aboveTitle?: React.ReactNode;
  /** Slightly wider column for the single-page flow */
  wide?: boolean;
  /** @deprecated Multi-page steps removed; kept for result pages */
  step?: 'phone' | 'address' | 'review' | 'pay';
}

export function CheckoutShell({
  children,
  className,
  title,
  description,
  aboveTitle,
  wide,
}: CheckoutShellProps) {
  const { locale, toggleLocale, t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col bg-white text-foreground">
      <header className="animate-in fade-in-0 slide-in-from-top-1 px-4 pt-5 duration-300 fill-mode-both sm:px-6">
        {/* Always LTR so brand stays left and language stays right */}
        <div
          dir="ltr"
          className={cn(
            'mx-auto flex w-full items-center justify-between',
            wide ? 'max-w-lg' : 'max-w-md',
          )}
        >
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-80"
          >
            <Image
              src="/rukny-logo.svg"
              alt={t('brandAlt')}
              width={30}
              height={30}
              className="size-[30px] transition-transform duration-200 group-hover:scale-[1.04]"
              priority
            />
            <p className="text-[15px] font-semibold tracking-tight">
              Rukny Checkout
            </p>
          </Link>

          <Button
            size="sm"
            variant="secondary"
            onPress={toggleLocale}
            aria-label={t('langAria')}
            className="h-9 gap-1.5 rounded-full border border-border/80 bg-white px-3 text-[13px] font-medium text-foreground shadow-none transition-colors duration-200 hover:bg-muted"
          >
            <Languages className="size-3.5 text-muted-foreground" aria-hidden />
            <span key={locale} className="animate-in fade-in-0 zoom-in-95 duration-200">
              {locale === 'ar' ? t('switchToEn') : t('switchToAr')}
            </span>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 pb-12 pt-6 sm:pt-8">
        <div
          className={cn(
            'checkout-fade-up flex w-full flex-col gap-5',
            wide ? 'max-w-lg' : 'max-w-md',
            className,
          )}
        >
          {aboveTitle ? (
            <div className="checkout-section-enter checkout-stagger-1">
              {aboveTitle}
            </div>
          ) : null}

          {(title || description) && (
            <div className="checkout-section-enter checkout-stagger-2 space-y-1.5 px-0.5">
              {title ? (
                <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-zinc-900 transition-colors duration-200">
                  {title}
                </h1>
              ) : null}
              {description ? (
                <p className="max-w-[40ch] text-[15px] leading-7 text-zinc-500 transition-colors duration-200">
                  {description}
                </p>
              ) : null}
            </div>
          )}

          <div className="checkout-section-enter checkout-stagger-3">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
