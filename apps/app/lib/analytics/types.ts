export interface AnalyticsTrendPoint {
  date: string;
  clicks: number;
}

export interface AnalyticsDeviceItem {
  deviceType: string;
  clicks: number;
  percentage: number;
}

export interface AnalyticsCountryItem {
  country: string;
  clicks: number;
  percentage: number;
}

export interface AnalyticsReferrerItem {
  referrer: string;
  clicks: number;
  percentage: number;
}

/** API response — forms fields ignored in the app UI */
export interface AnalyticsOverview {
  summary: {
    totalClicks: number;
    totalLinkViews: number;
    linksCount: number;
    changes: {
      clicks: number;
    };
  };
  chartData: { date: string; clicks: number }[];
  deviceBreakdown: { device: string; clicks: number }[];
  countryBreakdown: { country: string; clicks: number }[];
  referrerBreakdown: { referrer: string; clicks: number }[];
  topLinks: {
    id: string;
    title: string;
    platform: string;
    url: string;
    clicks: number;
  }[];
}

export function toTrendPoints(
  chartData: AnalyticsOverview['chartData'],
): AnalyticsTrendPoint[] {
  return chartData.map((point) => ({
    date: point.date,
    clicks: point.clicks,
  }));
}

export function toDeviceItems(
  items: AnalyticsOverview['deviceBreakdown'],
): AnalyticsDeviceItem[] {
  const total = items.reduce((sum, item) => sum + item.clicks, 0);
  return items.map((item) => ({
    deviceType: item.device,
    clicks: item.clicks,
    percentage: total > 0 ? Math.round((item.clicks / total) * 100) : 0,
  }));
}

export function toCountryItems(
  items: AnalyticsOverview['countryBreakdown'],
): AnalyticsCountryItem[] {
  const total = items.reduce((sum, item) => sum + item.clicks, 0);
  return items.map((item) => ({
    country: item.country,
    clicks: item.clicks,
    percentage: total > 0 ? Math.round((item.clicks / total) * 100) : 0,
  }));
}

export function toReferrerItems(
  items: AnalyticsOverview['referrerBreakdown'],
): AnalyticsReferrerItem[] {
  const total = items.reduce((sum, item) => sum + item.clicks, 0);
  return items.map((item) => ({
    referrer: item.referrer,
    clicks: item.clicks,
    percentage: total > 0 ? Math.round((item.clicks / total) * 100) : 0,
  }));
}

export function getPeriodLabel(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

/** Pick link-only fields from the shared analytics API response */
export function normalizeAnalyticsOverview(raw: Record<string, unknown>): AnalyticsOverview {
  const summary = (raw.summary ?? {}) as Record<string, unknown>;
  const changes = (summary.changes ?? {}) as Record<string, unknown>;

  return {
    summary: {
      totalClicks: Number(summary.totalClicks ?? 0),
      totalLinkViews: Number(summary.totalLinkViews ?? 0),
      linksCount: Number(summary.linksCount ?? 0),
      changes: {
        clicks: Number(changes.clicks ?? 0),
      },
    },
    chartData: Array.isArray(raw.chartData)
      ? (raw.chartData as { date: string; clicks: number }[]).map((p) => ({
          date: p.date,
          clicks: Number(p.clicks ?? 0),
        }))
      : [],
    deviceBreakdown: Array.isArray(raw.deviceBreakdown)
      ? (raw.deviceBreakdown as { device: string; clicks: number }[])
      : [],
    countryBreakdown: Array.isArray(raw.countryBreakdown)
      ? (raw.countryBreakdown as { country: string; clicks: number }[])
      : [],
    referrerBreakdown: Array.isArray(raw.referrerBreakdown)
      ? (raw.referrerBreakdown as { referrer: string; clicks: number }[])
      : [],
    topLinks: Array.isArray(raw.topLinks)
      ? (raw.topLinks as AnalyticsOverview['topLinks'])
      : [],
  };
}
