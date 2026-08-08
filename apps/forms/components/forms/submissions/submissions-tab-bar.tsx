'use client';

import { Button } from '@heroui/react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Download, Inbox, LayoutList, Users } from 'lucide-react';
import {
  DashboardMetricCard,
  type DashboardMetricChipTone,
} from '@/components/app/dashboard-metric-card';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { pillTabClassName } from '@/components/ui/pill-tab';
import { formDetailCardClass } from '@/lib/form-detail-styles';
import { formatNumber } from '@/lib/dashboard-format';
import {
  SUBMISSIONS_TABS,
  type SubmissionsViewTab,
} from '@/lib/submission-utils';
import { cn } from '@/lib/utils';

function parseTab(raw: string | null): SubmissionsViewTab {
  if (raw === 'question' || raw === 'individual') return raw;
  return 'summary';
}

export function SubmissionsTabBar({
  total,
  exporting,
  canExport = true,
  onExport,
  emailCount = 0,
}: {
  total: number;
  exporting?: boolean;
  canExport?: boolean;
  onExport: () => void;
  emailCount?: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get('tab'));
  const activeTabLabel =
    SUBMISSIONS_TABS.find((t) => t.id === tab)?.label ?? 'ملخص';

  const summaryItems = [
    {
      icon: Inbox,
      label: 'إجمالي الاستجابات',
      value: formatNumber(total),
      comparisonPrimary: total === 1 ? 'استجابة واحدة' : 'كل الردود المستلمة',
      comparisonSecondary: 'المجمّع',
      tabular: true as const,
      chip: total > 0 ? 'نشط' : 'فارغ',
      chipTone: (total > 0 ? 'success' : 'neutral') as DashboardMetricChipTone,
    },
    {
      icon: Users,
      label: 'بريد معروف',
      value: formatNumber(emailCount),
      comparisonPrimary: 'من الاستجابات المحمّلة',
      comparisonSecondary: 'بريد المستجيب',
      tabular: true as const,
      chip: undefined,
      chipTone: undefined,
    },
    {
      icon: LayoutList,
      label: 'العرض الحالي',
      value: activeTabLabel,
      comparisonPrimary: 'تبويب الاستجابات',
      comparisonSecondary: 'طريقة العرض',
      tabular: false as const,
      chip: activeTabLabel,
      chipTone: 'neutral' as DashboardMetricChipTone,
    },
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SettingsSectionCard
        plain
        title="ملخص الاستجابات"
        description="نظرة سريعة على الردود والعرض الحالي"
      >
        <div className="grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-3">
          {summaryItems.map((item) => (
            <DashboardMetricCard
              key={item.label}
              icon={item.icon}
              label={item.label}
              value={item.value}
              comparisonPrimary={item.comparisonPrimary}
              comparisonSecondary={item.comparisonSecondary}
              tabular={item.tabular}
              chip={item.chip}
              chipTone={item.chipTone}
            />
          ))}
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard plain title="العرض والتصدير" description="بدّل طريقة العرض أو صدّر البيانات">
        <div className={cn(formDetailCardClass, 'gap-4')}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <nav
              className="flex flex-wrap gap-2"
              aria-label="عرض الاستجابات"
            >
              {SUBMISSIONS_TABS.map((item) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('tab', item.id);
                const href = `${pathname}?${params.toString()}`;
                const active = tab === item.id;

                return (
                  <Link
                    key={item.id}
                    href={href}
                    scroll={false}
                    aria-current={active ? 'page' : undefined}
                    className={pillTabClassName(active)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {canExport ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onPress={onExport}
                isDisabled={exporting || total === 0}
                className="h-10 shrink-0 rounded-xl border-[var(--border)] px-4"
              >
                <Download className="size-3.5" />
                {exporting ? 'جاري التصدير…' : 'تصدير CSV'}
              </Button>
            ) : null}
          </div>
        </div>
      </SettingsSectionCard>
    </div>
  );
}

export function useSubmissionsTab(): SubmissionsViewTab {
  const searchParams = useSearchParams();
  return parseTab(searchParams.get('tab'));
}
