'use client';

import { ChevronDown } from 'lucide-react';
import { Accordion } from '@heroui/react';
import { HelpFaqAnswer } from '@/components/help/help-faq-answer';
import { HelpSectionHeader } from '@/components/help/help-section-header';
import type { HelpCategoryId, HelpFaqItem } from '@/lib/help/help-content';
import { HELP_CATEGORIES } from '@/lib/help/help-content';
import { pillTabClassName, pillTabGroupClassName } from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

interface HelpFaqSectionProps {
  items: HelpFaqItem[];
  category: HelpCategoryId | 'all';
  onCategoryChange: (category: HelpCategoryId | 'all') => void;
  emptyMessage?: string;
}

export function HelpFaqSection({
  items,
  category,
  onCategoryChange,
  emptyMessage = 'لم نجد نتيجة — جرّب كلمات أخرى أو تواصل معنا.',
}: HelpFaqSectionProps) {
  const grouped = HELP_CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.category === cat.id),
  })).filter((g) => g.items.length > 0);

  return (
    <section className="space-y-5" id="help-faq">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <HelpSectionHeader
          title="الأسئلة الشائعة"
          description="إجابات عن التصميم، النشر، والاستجابات"
          className="flex-1"
        />

        <div
          className={cn(
            pillTabGroupClassName,
            'justify-start gap-2 lg:max-w-[55%] lg:flex-wrap lg:justify-end',
          )}
        >
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
      </div>

      {grouped.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/40 px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div
              key={group.id}
              id={
                group.id === 'design'
                  ? 'faq-design'
                  : group.id === 'publish'
                    ? 'faq-publish'
                    : undefined
              }
            >
              {category === 'all' ? (
                <div className="mb-3 flex items-baseline gap-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    {group.label}
                  </h3>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {group.description}
                  </span>
                </div>
              ) : null}
              <Accordion
                allowsMultipleExpanded
                className="w-full"
                variant="surface"
              >
                {group.items.map((item) => (
                  <Accordion.Item key={item.id} id={item.id}>
                    <Accordion.Heading>
                      <Accordion.Trigger className="text-start font-semibold text-[var(--foreground)]">
                        {item.question}
                        <Accordion.Indicator>
                          <ChevronDown className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                        </Accordion.Indicator>
                      </Accordion.Trigger>
                    </Accordion.Heading>
                    <Accordion.Panel>
                      <Accordion.Body className="pb-1 pt-0">
                        <HelpFaqAnswer answer={item.answer} links={item.links} />
                      </Accordion.Body>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
