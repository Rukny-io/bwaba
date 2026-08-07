'use client';

import { useEffect } from 'react';
import { CircleHelp, SearchX } from 'lucide-react';
import { HelpFaqCard } from '@/components/help/help-faq-card';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import type { HelpCategoryId, HelpFaqItem } from '@/lib/help/help-content';
import { HELP_CATEGORIES } from '@/lib/help/help-content';
import { pillTabClassName, pillTabGroupClassName } from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

interface HelpFaqSectionProps {
  items: HelpFaqItem[];
  category: HelpCategoryId | 'all';
  onCategoryChange: (category: HelpCategoryId | 'all') => void;
  query?: string;
  emptyMessage?: string;
}

function categoryFromHash(hash: string): HelpCategoryId | null {
  if (hash === '#faq-design') return 'design';
  if (hash === '#faq-publish') return 'publish';
  return null;
}

export function HelpFaqSection({
  items,
  category,
  onCategoryChange,
  query = '',
  emptyMessage = 'لم نجد نتيجة — جرّب كلمات أخرى أو تواصل معنا.',
}: HelpFaqSectionProps) {
  useEffect(() => {
    const applyHash = () => {
      const fromHash = categoryFromHash(window.location.hash);
      if (fromHash) onCategoryChange(fromHash);
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [onCategoryChange]);

  const hasQuery = query.trim().length > 0;
  const resultLabel =
    items.length === 0
      ? 'لا نتائج'
      : items.length === 1
        ? 'نتيجة واحدة'
        : `${items.length} نتائج`;

  return (
    <SettingsSectionCard
      icon={CircleHelp}
      title="الأسئلة الشائعة"
      description="نتائج جاهزة للقراءة — الإجابة ظاهرة مباشرة دون فتح كل سؤال."
      className="scroll-mt-4"
    >
      <div id="help-faq" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className={cn(pillTabGroupClassName, 'justify-start gap-2')}>
            <button
              type="button"
              onClick={() => onCategoryChange('all')}
              className={pillTabClassName(
                category === 'all',
                'min-h-9 px-3.5 py-2 text-xs sm:text-sm',
              )}
            >
              الكل
            </button>
            {HELP_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={pillTabClassName(
                  category === cat.id,
                  'min-h-9 px-3.5 py-2 text-xs sm:text-sm',
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <p className="text-[12px] font-medium text-[var(--muted-foreground)]">
            {hasQuery ? (
              <>
                البحث عن «{query.trim()}» · {resultLabel}
              </>
            ) : (
              resultLabel
            )}
          </p>
        </div>

        {/* Anchor targets used by quick links */}
        <div id="faq-design" className="sr-only" aria-hidden />
        <div id="faq-publish" className="sr-only" aria-hidden />

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/40 px-4 py-12 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--muted-foreground)] ring-1 ring-[var(--border)]/40">
              <SearchX className="size-4" strokeWidth={1.85} />
            </div>
            <p className="max-w-sm text-sm text-[var(--muted-foreground)]">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
            {items.map((item) => (
              <HelpFaqCard key={item.id} item={item} query={query} />
            ))}
          </div>
        )}
      </div>
    </SettingsSectionCard>
  );
}
