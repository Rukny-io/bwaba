'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { ToggleButton, ToggleButtonGroup } from '@heroui/react';
import {
  LOCALE_LABELS,
  LOCALE_SHORT,
  getDirection,
  type AppLocale,
} from '@/lib/i18n';
import { agLayout } from '@/lib/public-antigravity-theme';
import { switchLocale } from '@/lib/switch-locale';
import { cn } from '@/lib/utils';

const LOCALES: AppLocale[] = ['ar', 'en', 'ckb'];

type LanguageSwitcherProps = {
  className?: string;
  variant?: 'header' | 'footer';
};

export function LanguageSwitcher({
  className,
  variant = 'header',
}: LanguageSwitcherProps) {
  const t = useTranslations('locale');
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const dir = getDirection(locale);

  const onChange = (next: AppLocale) => {
    if (next === locale) return;
    switchLocale(next, router);
  };

  if (variant === 'footer') {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        <span className="text-[12px] text-[#9CA3AF]">{t('label')}</span>
        <ToggleButtonGroup
          selectionMode="single"
          selectedKeys={new Set([locale])}
          onSelectionChange={(keys) => {
            const key = [...keys][0];
            if (key != null) onChange(String(key) as AppLocale);
          }}
          size="sm"
          className="inline-flex gap-1"
        >
          {LOCALES.map((code) => (
            <ToggleButton
              key={code}
              id={code}
              className={cn(
                'h-auto min-h-0 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors',
                'text-[#6B6F76] hover:bg-[#F5F5F5] hover:text-[#1D1D1D]',
                'data-[selected=true]:bg-[#1D1D1D] data-[selected=true]:text-white',
                'data-[selected=true]:hover:bg-[#0A0A0A]',
              )}
            >
              {LOCALE_LABELS[code]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
    );
  }

  return (
    <HeaderLanguageMenu
      className={className}
      locale={locale}
      dir={dir}
      label={t('label')}
      onChange={onChange}
    />
  );
}

function HeaderLanguageMenu({
  className,
  locale,
  dir,
  label,
  onChange,
}: {
  className?: string;
  locale: AppLocale;
  dir: 'rtl' | 'ltr';
  label: string;
  onChange: (next: AppLocale) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const selectLocale = (code: AppLocale) => {
    setOpen(false);
    onChange(code);
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-label={`${label}: ${LOCALE_LABELS[locale]}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex h-9 items-center gap-1 rounded-full px-3.5',
          'text-[13px] font-medium transition-colors',
          open ? agLayout.navActive : agLayout.navIdle,
        )}
      >
        <Globe className="size-3.5 shrink-0 opacity-50" aria-hidden />
        <span className="tabular-nums">{LOCALE_SHORT[locale]}</span>
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 opacity-40 transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={label}
          dir={dir}
          className={cn(
            'absolute end-0 top-[calc(100%+6px)] z-[70] min-w-[10rem]',
            'overflow-hidden rounded-2xl bg-white p-1',
          )}
        >
          {LOCALES.map((code) => {
            const selected = code === locale;

            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => selectLocale(code)}
                className={cn(
                  'flex w-full min-h-8 items-center gap-2 rounded-xl px-3 py-1.5',
                  'text-start text-[13px] transition-colors',
                  selected
                    ? 'bg-[#FAFAFA] font-medium text-[#1D1D1D]'
                    : 'text-[#6B6F76] hover:bg-[#FAFAFA] hover:text-[#1D1D1D]',
                )}
              >
                <span className="flex size-3.5 shrink-0 items-center justify-center">
                  {selected ? (
                    <Check className="size-3" strokeWidth={2} aria-hidden />
                  ) : null}
                </span>
                {LOCALE_LABELS[code]}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
