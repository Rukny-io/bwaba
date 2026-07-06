'use client';

import { useMemo, useState } from 'react';
import { Lightbulb, Search } from 'lucide-react';
import { HelpContactCard } from '@/components/help/help-contact-card';
import { HelpFaqSection } from '@/components/help/help-faq-section';
import { HelpQuickLinks } from '@/components/help/help-quick-links';
import { HelpResourceLinks } from '@/components/help/help-resource-links';
import { HelpSectionHeader } from '@/components/help/help-section-header';
import {
  filterHelpFaq,
  HELP_FAQ,
  type HelpCategoryId,
} from '@/lib/help/help-content';
import { cn } from '@/lib/utils';

export function HelpView() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<HelpCategoryId | 'all'>('all');

  const filteredFaq = useMemo(
    () => filterHelpFaq(HELP_FAQ, query, category),
    [query, category],
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
            المساعدة
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
            أدلة سريعة، أسئلة شائعة، وروابط مباشرة — كل ما تحتاجه لإنشاء نموذج
            وتخصيصه ونشره.
          </p>
        </div>

        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث: نشر، تصميم، خط، استجابات…"
            className={cn(
              'h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)]',
              'ps-10 pe-4 text-sm text-[var(--foreground)] outline-none',
              'placeholder:text-[var(--muted-foreground)]',
              'transition-[border-color,box-shadow] focus:border-[var(--foreground)]/25 focus:ring-2 focus:ring-[var(--accent)]/30',
            )}
            aria-label="بحث في المساعدة"
          />
        </div>
      </header>

      <aside className="help-section-card flex gap-3 border-[var(--primary)]/15 bg-[var(--primary)]/[0.04] p-4 sm:gap-4 sm:p-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/12 text-[var(--primary)]">
          <Lightbulb className="size-[18px]" strokeWidth={1.8} aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            نصيحة سريعة
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--foreground)]/75 sm:text-sm">
            التخصيصات (خط، لون، زوايا، عرض) تظهر فوراً في «معاينة كاملة» قبل
            النشر. جرّب قالب «داكن» مع لون أساسي مخصّص لنتيجة احترافية.
          </p>
        </div>
      </aside>

      <section className="space-y-4">
        <HelpSectionHeader
          title="ابدأ من هنا"
          description="اختصارات للمهام الأكثر شيوعاً"
        />
        <HelpQuickLinks />
      </section>

      <HelpResourceLinks />

      <HelpFaqSection
        items={filteredFaq}
        category={category}
        onCategoryChange={setCategory}
      />

      <HelpContactCard />
    </div>
  );
}
