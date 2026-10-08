import type { AnalyticsOverview } from '@/lib/analytics/types';
import type { CommerceSnapshot } from '@/lib/commerce/types';
import { formatNumber } from '@/lib/dashboard-format';
import type { SocialLink } from '@/lib/links/types';

export type InsightSeverity = 'info' | 'warning' | 'success' | 'danger';

export interface AppInsight {
  id: string;
  severity: InsightSeverity;
  title: string;
  description: string;
  href?: string;
}

type Translate = (
  path: string,
  vars?: Record<string, string | number>,
) => string;

export function buildAppInsights(input: {
  analytics: AnalyticsOverview;
  commerce: CommerceSnapshot;
  links: SocialLink[];
  t: Translate;
}): AppInsight[] {
  const { analytics, commerce, links, t } = input;
  const insights: AppInsight[] = [];
  const { orderStats, productStats, storeStats } = commerce;
  const hiddenLinks = links.filter((l) => l.status === 'hidden');
  const activeLinks = links.filter((l) => l.status === 'active');

  if (orderStats.pendingOrders > 0) {
    insights.push({
      id: 'pending-orders',
      severity: 'warning',
      title: t('analytics.insights.pendingOrdersTitle', {
        n: formatNumber(orderStats.pendingOrders),
      }),
      description: t('analytics.insights.pendingOrdersDesc'),
      href: '/app/orders',
    });
  }

  if (productStats.lowStock > 0) {
    insights.push({
      id: 'low-stock',
      severity: 'warning',
      title: t('analytics.insights.lowStockTitle', {
        n: formatNumber(productStats.lowStock),
      }),
      description: t('analytics.insights.lowStockDesc'),
      href: '/app/products',
    });
  }

  if (productStats.outOfStock > 0) {
    insights.push({
      id: 'out-of-stock',
      severity: 'danger',
      title: t('analytics.insights.outOfStockTitle', {
        n: formatNumber(productStats.outOfStock),
      }),
      description: t('analytics.insights.outOfStockDesc'),
      href: '/app/products',
    });
  }

  if (analytics.summary.changes.clicks < -10) {
    insights.push({
      id: 'clicks-down',
      severity: 'warning',
      title: t('analytics.insights.clicksDownTitle'),
      description: t('analytics.insights.clicksDownDesc', {
        n: Math.abs(analytics.summary.changes.clicks),
      }),
      href: '/app/analytics',
    });
  } else if (analytics.summary.changes.clicks > 15) {
    insights.push({
      id: 'clicks-up',
      severity: 'success',
      title: t('analytics.insights.clicksUpTitle'),
      description: t('analytics.insights.clicksUpDesc', {
        n: analytics.summary.changes.clicks,
      }),
      href: '/app/analytics',
    });
  }

  if (hiddenLinks.length > 0) {
    insights.push({
      id: 'hidden-links',
      severity: 'info',
      title: t('analytics.insights.hiddenLinksTitle', {
        n: formatNumber(hiddenLinks.length),
      }),
      description: t('analytics.insights.hiddenLinksDesc'),
      href: '/app/links',
    });
  }

  if (links.length === 0) {
    insights.push({
      id: 'no-links',
      severity: 'info',
      title: t('analytics.insights.noLinksTitle'),
      description: t('analytics.insights.noLinksDesc'),
      href: '/app/links',
    });
  } else if (activeLinks.length === 0) {
    insights.push({
      id: 'no-active-links',
      severity: 'warning',
      title: t('analytics.insights.noActiveLinksTitle'),
      description: t('analytics.insights.noActiveLinksDesc'),
      href: '/app/links',
    });
  }

  if (!storeStats.hasStore && productStats.totalProducts === 0) {
    insights.push({
      id: 'no-store',
      severity: 'info',
      title: t('analytics.insights.noStoreTitle'),
      description: t('analytics.insights.noStoreDesc'),
      href: '/app/products',
    });
  } else if (storeStats.hasStore && productStats.totalProducts === 0) {
    insights.push({
      id: 'no-products',
      severity: 'info',
      title: t('analytics.insights.noProductsTitle'),
      description: t('analytics.insights.noProductsDesc'),
      href: '/app/products',
    });
  }

  if (orderStats.processingOrders > 0) {
    insights.push({
      id: 'processing-orders',
      severity: 'info',
      title: t('analytics.insights.processingOrdersTitle', {
        n: formatNumber(orderStats.processingOrders),
      }),
      description: t('analytics.insights.processingOrdersDesc'),
      href: '/app/orders',
    });
  }

  if (
    insights.length === 0 &&
    analytics.summary.totalClicks > 0 &&
    orderStats.totalOrders > 0
  ) {
    insights.push({
      id: 'all-good',
      severity: 'success',
      title: t('analytics.insights.allGoodTitle'),
      description: t('analytics.insights.allGoodDesc'),
    });
  }

  return insights.slice(0, 6);
}
