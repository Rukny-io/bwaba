'use client';

import { useMemo, useState } from 'react';
import { Compass, Lightbulb, Search } from 'lucide-react';
import { HelpContactCard } from '@/components/help/help-contact-card';
import { HelpFaqSection } from '@/components/help/help-faq-section';
import { HelpQuickLinks } from '@/components/help/help-quick-links';
import { HelpResourceLinks } from '@/components/help/help-resource-links';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { fieldInputClass } from '@/components/forms/shared/form-field-input-class';
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
    <>
      <DashboardPageHeader
        title="المساعدة"
        description="أدلة سريعة، أسئلة شائعة، وروابط مباشرة — كل ما تحتاجه لإنشاء نموذج وتخصيصه ونشره."
        className="mb-0"
      >
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
            className={cn(fieldInputClass, 'h-11 ps-10 pe-4 text-sm')}
            aria-label="بحث في المساعدة"
          />
        </div>
      </DashboardPageHeader>

      <aside className="flex gap-3 rounded-3xl border border-[var(--primary)]/15 bg-[var(--primary)]/[0.04] p-3.5 sm:gap-4 sm:p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--primary)] ring-1 ring-[var(--border)]/40">
          <Lightbulb className="size-4" strokeWidth={1.85} aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-[14px] font-semibold text-[var(--foreground)] sm:text-[15px]">
            نصيحة سريعة
          </p>
          <p className="text-[12px] leading-relaxed text-[var(--muted-foreground)] sm:text-[13px]">
            التخصيصات (خط، لون، زوايا، عرض) تظهر فوراً في «معاينة كاملة» قبل
            النشر. جرّب قالب «داكن» مع لون أساسي مخصّص لنتيجة احترافية.
          </p>
        </div>
      </aside>

      <SettingsSectionCard
        icon={Compass}
        title="ابدأ من هنا"
        description="اختصارات للمهام الأكثر شيوعاً"
      >
        <HelpQuickLinks />
      </SettingsSectionCard>

      <HelpResourceLinks />

      <HelpFaqSection
        items={filteredFaq}
        category={category}
        onCategoryChange={setCategory}
        query={query}
      />

      <HelpContactCard />
    </>
  );
}
