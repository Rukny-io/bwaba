'use client';

import { Button } from '@heroui/react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Download, Inbox, Search, Users } from 'lucide-react';
import { pillTabClassName } from '@/components/ui/pill-tab';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import { formatNumber } from '@/lib/dashboard-format';
import {
  SUBMISSIONS_TABS,
  type SubmissionsViewTab,
} from '@/lib/submission-utils';

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

  const summaryItems = [
    {
      icon: Inbox,
      label: 'إجمالي الاستجابات',
      value: formatNumber(total),
      hint: total === 1 ? 'استجابة واحدة' : 'كل الردود المستلمة',
    },
    {
      icon: Users,
      label: 'بريد معروف',
      value: formatNumber(emailCount),
      hint: 'من الاستجابات المحمّلة',
    },
    {
      icon: Search,
      label: 'العرض الحالي',
      value: SUBMISSIONS_TABS.find((t) => t.id === tab)?.label ?? 'ملخص',
      hint: 'تبويب الاستجابات',
      tabular: false,
    },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {summaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <DashboardSurface
              key={item.label}
              padding="sm"
              className="flex items-center gap-3"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)]">
                <Icon size={16} strokeWidth={1.7} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  {item.label}
                </p>
                <p
                  className="truncate text-base font-bold text-[var(--foreground)] sm:text-lg"
                  dir={item.tabular === false ? undefined : 'ltr'}
                  lang={item.tabular === false ? undefined : 'en'}
                >
                  {item.value}
                </p>
                <p className="truncate text-[10px] text-[var(--muted-foreground)]/80">
                  {item.hint}
                </p>
              </div>
            </DashboardSurface>
          );
        })}
      </div>

      <DashboardSurface padding="md" className="space-y-4">
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
      </DashboardSurface>
    </div>
  );
}

export function useSubmissionsTab(): SubmissionsViewTab {
  const searchParams = useSearchParams();
  return parseTab(searchParams.get('tab'));
}

export function useSubmissionsTabNavigate() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (tab: SubmissionsViewTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
}
