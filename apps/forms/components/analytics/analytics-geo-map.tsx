'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { AnalyticsGeoBreakdown } from '@/lib/forms-api';
import { formatNumber } from '@/lib/dashboard-format';
import { pillTabClassName } from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

const AnalyticsLeafletMap = dynamic(() => import('./analytics-leaflet-map'), {
  ssr: false,
  loading: () => (
    <div className="analytics-geo-map analytics-geo-map--loading flex h-[380px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="size-6 animate-spin rounded-full border-2 border-[var(--primary)] border-r-transparent" />
        <span className="text-[13px] text-[var(--muted-foreground)]">
          جاري تحميل الخريطة…
        </span>
      </div>
    </div>
  ),
});

type GeoMetric = 'views' | 'submissions';
type GeoLevel = 'governorates' | 'countries';

interface AnalyticsGeoMapProps {
  data: AnalyticsGeoBreakdown;
  className?: string;
  showGovernorates?: boolean;
  defaultLevel?: GeoLevel;
  /** Controlled map level (optional) */
  level?: GeoLevel;
  onLevelChange?: (level: GeoLevel) => void;
  hideTitle?: boolean;
  hideMetricTabs?: boolean;
  hideLevelTabs?: boolean;
  metric?: GeoMetric;
  mapHeight?: number;
  /** Flat layout without extra outer spacing */
  embedded?: boolean;
}

const COLOR_MIN = '#dbeafe';
const COLOR_MAX = '#3b82f6';

export function AnalyticsGeoMap({
  data,
  className,
  showGovernorates = false,
  defaultLevel = 'countries',
  level: levelProp,
  onLevelChange,
  hideTitle = false,
  hideMetricTabs = false,
  hideLevelTabs = false,
  metric: metricProp,
  mapHeight = 320,
  embedded = false,
}: AnalyticsGeoMapProps) {
  const [metricInternal, setMetricInternal] = useState<GeoMetric>('views');
  const [levelInternal, setLevelInternal] = useState<GeoLevel>(
    showGovernorates ? defaultLevel : 'countries',
  );

  const metric = metricProp ?? metricInternal;
  const level = levelProp ?? levelInternal;

  function setLevel(next: GeoLevel) {
    if (onLevelChange) onLevelChange(next);
    else setLevelInternal(next);
  }

  const maxValue = metric === 'views' ? data.maxViews : data.maxSubmissions;

  const topRegions = useMemo(() => {
    const rows = level === 'governorates' ? data.governorates : data.countries;
    return [...rows]
      .sort((a, b) =>
        metric === 'views' ? b.views - a.views : b.submissions - a.submissions,
      )
      .filter((r) => (metric === 'views' ? r.views : r.submissions) > 0)
      .slice(0, 3);
  }, [data, metric, level]);

  const hasData = topRegions.length > 0;
  const showToolbar =
    !hideTitle || (!hideMetricTabs && !metricProp) || (showGovernorates && !hideLevelTabs);

  return (
    <div className={cn('w-full', embedded ? 'space-y-4' : 'space-y-3', className)}>
      {showToolbar ? (
        <div
          className={cn(
            'flex flex-col gap-3',
            hideTitle ? 'items-center' : 'sm:flex-row sm:flex-wrap sm:justify-between',
          )}
        >
          {!hideTitle ? (
            <div className="text-center sm:text-start">
              <h3 className="text-[14px] font-semibold text-[var(--foreground)]">
                التوزيع الجغرافي
              </h3>
              <p className="text-[12px] text-[var(--muted-foreground)]">
                {level === 'governorates'
                  ? 'محافظات العراق'
                  : 'الدول · نظرة عالمية'}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-center gap-2">
            {showGovernorates && !hideLevelTabs ? (
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
      ) : null}

      <div className="relative">
        <AnalyticsLeafletMap
          data={data}
          metric={metric}
          level={level}
          height={mapHeight}
        />

        {!hasData ? (
          <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center rounded-[25px] bg-[var(--surface)]/55 backdrop-blur-[2px]">
            <p className="rounded-full border border-[var(--border)]/60 bg-[var(--surface)] px-4 py-2 text-[12px] text-[var(--muted-foreground)] shadow-sm">
              لا توجد بيانات جغرافية في هذه الفترة
            </p>
          </div>
        ) : null}
      </div>

      {hasData ? (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-28 rounded-full"
              style={{
                background: `linear-gradient(to right, ${COLOR_MIN}, ${COLOR_MAX})`,
              }}
            />
            <span
              dir="ltr"
              lang="en"
              className="text-[10px] tabular-nums text-[var(--muted-foreground)]"
            >
              0 — {formatNumber(maxValue)}
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {topRegions.map((row) => (
              <span
                key={row.code}
                className="rounded-full border border-[rgba(0,0,0,0.06)] bg-white px-2.5 py-1 text-[10px] text-[var(--muted-foreground)] shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
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
