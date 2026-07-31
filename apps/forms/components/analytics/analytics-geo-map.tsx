'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { AnalyticsGeoBreakdown } from '@/lib/forms-api';
import { formatNumber } from '@/lib/dashboard-format';
import { pillTabClassName } from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

// Dynamically import the leaflet map with SSR disabled
const AnalyticsLeafletMap = dynamic(
  () => import('./analytics-leaflet-map'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/30">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-r-transparent"></div>
          <span className="text-sm text-[var(--muted-foreground)]">جاري تحميل الخريطة...</span>
        </div>
      </div>
    )
  }
);

type GeoMetric = 'views' | 'submissions';
type GeoLevel = 'governorates' | 'countries';

interface AnalyticsGeoMapProps {
  data: AnalyticsGeoBreakdown;
  className?: string;
  showGovernorates?: boolean;
  defaultLevel?: GeoLevel;
  hideTitle?: boolean;
  hideMetricTabs?: boolean;
  metric?: GeoMetric;
  mapHeight?: number;
}

const COLOR_MIN = '#dbeafe';
const COLOR_MAX = '#3b82f6';

export function AnalyticsGeoMap({
  data,
  className,
  showGovernorates = false,
  defaultLevel = 'countries',
  hideTitle = false,
  hideMetricTabs = false,
  metric: metricProp,
  mapHeight = 320,
}: AnalyticsGeoMapProps) {
  const [metricInternal, setMetricInternal] = useState<GeoMetric>('views');
  const metric = metricProp ?? metricInternal;
  const [level, setLevel] = useState<GeoLevel>(
    showGovernorates ? defaultLevel : 'countries',
  );

  const maxValue = metric === 'views' ? data.maxViews : data.maxSubmissions;

  const topRegions = useMemo(() => {
    const rows = level === 'governorates' ? data.governorates : data.countries;
    return [...rows]
      .sort(
        (a, b) =>
          (metric === 'views' ? b.views - a.views : b.submissions - a.submissions),
      )
      .filter((r) => (metric === 'views' ? r.views : r.submissions) > 0)
      .slice(0, 3);
  }, [data, metric, level]);

  const hasData = topRegions.length > 0;

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-3 flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-between">
        {!hideTitle ? (
          <div className="text-center sm:text-start">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              التوزيع الجغرافي
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              {level === 'governorates'
                ? 'محافظات العراق'
                : 'الدول · نظرة عالمية'}
            </p>
          </div>
        ) : null}
        <div className="flex flex-wrap justify-center gap-2">
          {showGovernorates ? (
            <>
              <button
                type="button"
                className={pillTabClassName(level === 'governorates')}
                onClick={() => setLevel('governorates')}
              >
                خارطة العراق
              </button>
              <button
                type="button"
                className={pillTabClassName(level === 'countries')}
                onClick={() => setLevel('countries')}
              >
                خارطة العالم
              </button>
            </>
          ) : null}
          {!hideMetricTabs ? (
            <>
              <button
                type="button"
                className={pillTabClassName(metric === 'views')}
                onClick={() => setMetricInternal('views')}
              >
                مشاهدات
              </button>
              <button
                type="button"
                className={pillTabClassName(metric === 'submissions')}
                onClick={() => setMetricInternal('submissions')}
              >
                استجابات
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="relative">
        <AnalyticsLeafletMap
          data={data}
          metric={metric}
          level={level}
          height={mapHeight}
        />

        {!hasData ? (
          <div className="absolute inset-0 z-[400] flex items-center justify-center bg-[var(--surface)]/50 backdrop-blur-[1px] rounded-2xl pointer-events-none">
            <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] shadow-sm">
              لا توجد بيانات جغرافية في هذه الفترة
            </p>
          </div>
        ) : null}
      </div>

      {hasData ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-28 rounded-full"
              style={{
                background: `linear-gradient(to right, ${COLOR_MIN}, ${COLOR_MAX})`,
              }}
            />
            <span dir="ltr" lang="en" className="text-[10px] tabular-nums text-[var(--muted-foreground)]">
              0 — {formatNumber(maxValue)}
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {topRegions.map((row) => (
              <span
                key={row.code}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[10px] text-[var(--muted-foreground)]"
              >
                {row.nameAr || row.name}{' '}
                <span
                  dir="ltr"
                  lang="en"
                  className="font-bold tabular-nums text-[var(--foreground)]"
                >
                  {formatNumber(metric === 'views' ? row.views : row.submissions)}
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
