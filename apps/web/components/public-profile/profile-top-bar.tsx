'use client';

import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { ProfileLanguageSwitcher } from './profile-language-switcher';
import { cn } from './utils';

export function ProfileTopBar({ className }: { className?: string }) {
  const t = useTranslations('publicProfile.promo');

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-[var(--border)]/60 pb-2.5 pt-1.5 sm:pb-3 sm:pt-2',
        className,
      )}
    >
      <a
        href="/"
        className={cn(
          'group inline-flex min-w-0 flex-1 items-center gap-1.5 text-start',
          'text-xs font-medium leading-snug sm:text-[13px]',
          'text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]',
        )}
        aria-label={t('ariaLabel')}
      >
        <span className="shrink-0 font-bold text-[var(--foreground)]">{t('brand')}</span>
        <span className="hidden min-w-0 truncate opacity-80 sm:inline">{t('tagline')}</span>
        <span className="min-w-0 truncate opacity-80 sm:hidden">{t('taglineShort')}</span>
        <ArrowUpRight
          className="size-3 shrink-0 opacity-50 transition-transform group-hover:-translate-y-px group-hover:translate-x-px group-hover:opacity-80"
          aria-hidden
        />
      </a>

      <ProfileLanguageSwitcher variant="bar" className="shrink-0" />
    </div>
  );
}
