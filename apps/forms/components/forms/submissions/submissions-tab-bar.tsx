'use client';

import { Button } from '@heroui/react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { pillTabClassName, pillTabGroupClassName } from '@/components/ui/pill-tab';
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
}: {
  total: number;
  exporting?: boolean;
  canExport?: boolean;
  onExport: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get('tab'));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            <span dir="ltr" lang="en" className="tabular-nums">
              {formatNumber(total)}
            </span>{' '}
            <span className="text-lg font-semibold sm:text-xl">
              {total === 1 ? 'استجابة' : 'استجابات'}
            </span>
          </p>
        </div>
        {canExport ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onPress={onExport}
            isDisabled={exporting || total === 0}
            className="h-10 rounded-xl border-[var(--border)] px-4"
          >
            {exporting ? 'جاري التصدير…' : 'تصدير CSV'}
          </Button>
        ) : null}
      </div>

      <nav className={pillTabGroupClassName} aria-label="عرض الاستجابات">
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
