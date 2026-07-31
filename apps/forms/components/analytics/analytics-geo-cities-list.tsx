'use client';

import { CountryFlag } from '@/components/analytics/country-flag';
import type { AnalyticsGeoCity } from '@/lib/forms-api';
import { formatNumber } from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

export function AnalyticsGeoCitiesList({
  cities,
  className,
  limit = 8,
}: {
  cities: AnalyticsGeoCity[];
  className?: string;
  limit?: number;
}) {
  const rows = cities
    .filter((c) => c.views > 0 || c.submissions > 0)
    .slice(0, limit);

  if (rows.length === 0) {
    return (
      <p className="text-sm italic text-[var(--muted-foreground)]">
        لا توجد بيانات مدن في هذه الفترة
      </p>
    );
  }

  return (
    <ul className={cn('space-y-2', className)}>
      {rows.map((city) => (
        <li
          key={`${city.countryCode}-${city.name}`}
          className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-secondary)] px-3.5 py-2.5"
        >
          <div className="flex min-w-0 items-center gap-2">
            <CountryFlag code={city.countryCode} title={city.countryCode} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">
                {city.name}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {city.countryCode}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-end text-xs tabular-nums">
            <p className="font-medium text-[var(--foreground)]">
              {formatNumber(city.views)} مشاهدة
            </p>
            <p className="text-[var(--muted-foreground)]">
              {formatNumber(city.submissions)} استجابة
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
