'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { LinkLogo } from '@/components/app/links/platform-icons/link-logo';
import {
  buildLinkFromType,
  parseQuickLinkUrl,
  validateLinkForm,
} from '@/lib/links/build-link-from-type';
import {
  getDefaultLinkTitleFromUrl,
  resolveCatalogTypeFromUrl,
} from '@/lib/links/resolve-platform';
import type { CreateSocialLinkInput } from '@/lib/links/types';
import { cn } from '@/lib/utils';

interface LinkCatalogSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSubmitUrl: (payload: CreateSocialLinkInput) => Promise<void>;
  variant?: 'default' | 'panel';
}

export function LinkCatalogSearch({
  value,
  onChange,
  onSubmitUrl,
  variant = 'panel',
}: LinkCatalogSearchProps) {
  const isPanel = variant === 'panel';
  const parsedUrl = useMemo(() => parseQuickLinkUrl(value), [value]);
  const isUrlMode = parsedUrl !== null;
  const platformType = useMemo(
    () => (parsedUrl ? resolveCatalogTypeFromUrl(parsedUrl) : 'url'),
    [parsedUrl],
  );

  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!parsedUrl) {
      setTitle('');
      setError(null);
      return;
    }
    setTitle(getDefaultLinkTitleFromUrl(parsedUrl));
  }, [parsedUrl]);

  async function handleAddUrl() {
    if (!parsedUrl) return;
    const resolvedTitle = title.trim() || getDefaultLinkTitleFromUrl(parsedUrl);
    const validationError = validateLinkForm('url', { title: resolvedTitle, value: parsedUrl });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = buildLinkFromType(
        'url',
        platformType === 'url' ? 'link' : platformType,
        { title: resolvedTitle, value: parsedUrl },
      );
      await onSubmitUrl(payload);
      onChange('');
      setTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إضافة الرابط');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div
        className={cn(
          'flex items-center gap-2 bg-[var(--surface-secondary)] transition-colors duration-150',
          'focus-within:ring-2 focus-within:ring-[var(--foreground)]/8',
          isPanel
            ? 'h-9 rounded-lg px-3 focus-within:bg-[var(--surface-secondary)]'
            : 'h-11 rounded-full px-4 focus-within:bg-[var(--surface-secondary)]/80',
        )}
      >
        <Search
          className={cn(
            'shrink-0 text-[var(--muted-foreground)]',
            isPanel ? 'size-3.5' : 'size-4',
          )}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isPanel ? 'الصق رابطاً أو ابحث في الأنواع…' : 'الصق أو ابحث عن رابط'}
          className={cn(
            'w-full bg-transparent text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]',
            isPanel ? 'text-[12px]' : 'text-[14px]',
          )}
          dir={isUrlMode ? 'ltr' : 'rtl'}
          inputMode={isUrlMode ? 'url' : 'search'}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && isUrlMode && !saving) {
              event.preventDefault();
              void handleAddUrl();
            }
          }}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-all hover:bg-black/5 hover:text-[var(--foreground)] active:scale-90 dark:hover:bg-white/10"
            aria-label="مسح"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {isUrlMode && parsedUrl ? (
        <div className="rounded-xl bg-[var(--surface-secondary)]/70 px-2.5 py-2">
          <div className="flex items-center gap-2.5">
            <LinkLogo url={parsedUrl} platformType={platformType} size="sm" />

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="اسم الرابط"
              className={cn(
                'min-w-0 flex-1 bg-transparent text-[var(--foreground)] outline-none',
                'text-[13px] font-semibold placeholder:font-normal placeholder:text-[var(--muted-foreground)]',
              )}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !saving) {
                  event.preventDefault();
                  void handleAddUrl();
                }
              }}
            />

            <button
              type="button"
              disabled={saving}
              onClick={() => void handleAddUrl()}
              className={cn(
                'inline-flex h-8 shrink-0 items-center justify-center rounded-lg px-3',
                'bg-[var(--primary)] font-semibold text-[var(--primary-foreground)]',
                'transition-transform active:scale-[0.98] disabled:opacity-60',
                isPanel ? 'text-[12px]' : 'text-[13px]',
              )}
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : 'إضافة'}
            </button>
          </div>

          {error ? (
            <p className="mt-1.5 px-1 text-[11px] text-[var(--danger)]" role="alert">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function useLinkCatalogUrlMode(search: string) {
  return useMemo(() => parseQuickLinkUrl(search) !== null, [search]);
}
