'use client';

import { CountryFlag } from '@/components/analytics/country-flag';
import type {
  AnalyticsGeoBreakdown,
  AnalyticsGeoCity,
  AnalyticsGeoRegion,
} from '@/lib/forms-api';
import { formatNumber } from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

interface SimpleRow {
  key: string;
  label: string;
  countryCode?: string;
  count: number;
}

function SimpleBreakdownColumn({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: SimpleRow[];
  emptyLabel: string;
}) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
        {title}
      </h4>
      {rows.length === 0 ? (
        <p className="text-sm italic text-[var(--muted-foreground)]">
          {emptyLabel}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-[var(--surface-secondary)] px-3 py-2.5">
                {row.countryCode && row.label !== 'Unknown' ? (
                  <CountryFlag code={row.countryCode} title={row.countryCode} />
                ) : null}
                <span
                  className={cn(
                    'truncate text-sm text-[var(--foreground)]',
                    row.label === 'Unknown' && 'text-[var(--muted-foreground)]',
                  )}
                >
                  {row.label}
                </span>
              </div>
              <span
                dir="ltr"
                lang="en"
                className="shrink-0 text-sm font-medium tabular-nums text-[var(--foreground)]"
              >
                {formatNumber(row.count)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function buildCountryRows(
  countries: AnalyticsGeoRegion[],
  limit: number,
): SimpleRow[] {
  return [...countries]
    .filter((c) => c.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
    .map((c) => ({
      key: c.code,
      label: c.name,
      countryCode: c.code,
      count: c.views,
    }));
}

function buildCityRows(cities: AnalyticsGeoCity[], limit: number): SimpleRow[] {
  return [...cities]
    .filter((c) => c.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
    .map((c) => ({
      key: `${c.countryCode}-${c.name}`,
      label: c.name,
      countryCode: c.countryCode,
      count: c.views,
    }));
}

export function AnalyticsSimpleGeoGrid({
  data,
  className,
  limit = 6,
}: {
  data: AnalyticsGeoBreakdown;
  className?: string;
  limit?: number;
}) {
  const countries = buildCountryRows(data.countries, limit);
  const cities = buildCityRows(data.cities ?? [], limit);

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8',
        className,
      )}
    >
      <SimpleBreakdownColumn
        title="الدول"
        rows={countries}
        emptyLabel="لا توجد بيانات دول في هذه الفترة"
      />
      <SimpleBreakdownColumn
        title="المدن"
        rows={cities}
        emptyLabel="لا توجد بيانات مدن في هذه الفترة"
      />
    </div>
  );
}
