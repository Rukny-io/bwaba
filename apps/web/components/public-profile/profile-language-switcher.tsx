'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LOCALE_LABELS, LOCALE_SHORT, type AppLocale } from '@/lib/i18n';
import { switchLocale } from '@/lib/switch-locale';
import { cn } from '@/lib/utils';

const PROFILE_LOCALES: AppLocale[] = ['ar', 'en'];

type ProfileLanguageSwitcherProps = {
  className?: string;
  variant?: 'default' | 'compact' | 'bar';
};

export function ProfileLanguageSwitcher({
  className,
  variant = 'default',
}: ProfileLanguageSwitcherProps) {
  const t = useTranslations('publicProfile.footer');
  const locale = useLocale() as AppLocale;
  const router = useRouter();

  const onChange = (next: AppLocale) => {
    if (next === locale) return;
    switchLocale(next, router);
  };

  const isBar = variant === 'bar';
  const isCompact = variant === 'compact' || isBar;

  return (
    <div
      className={cn(
        variant === 'default' ? 'flex flex-col items-center gap-2' : 'inline-flex items-center gap-1.5',
        className,
      )}
    >
      {variant === 'default' ? (
        <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
          {t('language')}
        </span>
      ) : null}

      {isBar ? (
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
          <Globe className="size-3.5" aria-hidden />
        </span>
      ) : null}

      <div
        className={cn(
          'inline-flex gap-0.5 rounded-full p-0.5',
          isBar
            ? 'bg-[var(--surface-secondary)] ring-1 ring-[var(--border)]/80'
            : 'bg-[var(--surface-secondary)]',
        )}
        role="group"
        aria-label={t('language')}
      >
        {PROFILE_LOCALES.map((code) => {
          const selected = code === locale;
          return (
            <button
              key={code}
              type="button"
              onClick={() => onChange(code)}
              aria-pressed={selected}
              aria-label={LOCALE_LABELS[code]}
              className={cn(
                'rounded-full font-semibold transition-all',
                isCompact ? 'min-w-[2.25rem] px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-[12px]',
                selected
                  ? cn(
                      'bg-[var(--surface)] text-[var(--foreground)]',
                      isBar && 'shadow-[0_1px_2px_rgba(0,0,0,0.06)]',
                    )
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {isCompact ? LOCALE_SHORT[code] : LOCALE_LABELS[code]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
