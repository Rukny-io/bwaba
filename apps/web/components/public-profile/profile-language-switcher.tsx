'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { LOCALE_LABELS, LOCALE_SHORT, type AppLocale } from '@/lib/i18n';
import { switchLocale } from '@/lib/switch-locale';
import { cn } from '@/lib/utils';

const PROFILE_LOCALES: AppLocale[] = ['ar', 'en'];

type ProfileLanguageSwitcherProps = {
  className?: string;
  variant?: 'default' | 'compact';
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

  return (
    <div
      className={cn(
        variant === 'compact' ? 'inline-flex' : 'flex flex-col items-center gap-2',
        className,
      )}
    >
      {variant === 'default' ? (
        <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
          {t('language')}
        </span>
      ) : null}
      <div
        className="inline-flex gap-0.5 rounded-full bg-[var(--surface-secondary)] p-0.5"
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
              className={cn(
                'rounded-full font-semibold transition-colors',
                variant === 'compact' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-[12px]',
                selected
                  ? 'bg-[var(--surface)] text-[var(--foreground)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {variant === 'compact' ? LOCALE_SHORT[code] : LOCALE_LABELS[code]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
