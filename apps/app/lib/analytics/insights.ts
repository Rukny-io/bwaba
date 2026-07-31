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

export function buildAppInsights(input: {
  analytics: AnalyticsOverview;
  commerce: CommerceSnapshot;
  links: SocialLink[];
}): AppInsight[] {
  const { analytics, commerce, links } = input;
  const insights: AppInsight[] = [];
  const { orderStats, productStats, storeStats } = commerce;
  const hiddenLinks = links.filter((l) => l.status === 'hidden');
  const activeLinks = links.filter((l) => l.status === 'active');

  if (orderStats.pendingOrders > 0) {
    insights.push({
      id: 'pending-orders',
      severity: 'warning',
      title: `${formatNumber(orderStats.pendingOrders)} طلب معلّق`,
      description: 'راجع الطلبات الجديدة وعالجها في أقرب وقت.',
      href: '/app/orders',
    });
  }

  if (productStats.lowStock > 0) {
    insights.push({
      id: 'low-stock',
      severity: 'warning',
      title: `${formatNumber(productStats.lowStock)} منتج بمخزون منخفض`,
      description: 'حدّث الكميات لتجنب نفاد المخزون أثناء الطلب.',
      href: '/app/products',
    });
  }

  if (productStats.outOfStock > 0) {
    insights.push({
      id: 'out-of-stock',
      severity: 'danger',
      title: `${formatNumber(productStats.outOfStock)} منتج نفد مخزونه`,
      description: 'أعد تفعيل المنتجات أو أخفِها من صفحتك.',
      href: '/app/products',
    });
  }

  if (analytics.summary.changes.clicks < -10) {
    insights.push({
      id: 'clicks-down',
      severity: 'warning',
      title: 'انخفاض في نقرات الروابط',
      description: `تراجع بنسبة ${Math.abs(analytics.summary.changes.clicks)}% مقارنة بالفترة السابقة.`,
      href: '/app/analytics',
    });
  } else if (analytics.summary.changes.clicks > 15) {
    insights.push({
      id: 'clicks-up',
      severity: 'success',
      title: 'نمو قوي في نقرات الروابط',
      description: `زيادة بنسبة ${analytics.summary.changes.clicks}% عن الفترة السابقة.`,
      href: '/app/analytics',
    });
  }

  if (hiddenLinks.length > 0) {
    insights.push({
      id: 'hidden-links',
      severity: 'info',
      title: `${formatNumber(hiddenLinks.length)} رابط مخفي`,
      description: 'هذه الروابط لا تظهر لزوار صفحتك حالياً.',
      href: '/app/links',
    });
  }

  if (links.length === 0) {
    insights.push({
      id: 'no-links',
      severity: 'info',
      title: 'ابدأ ببناء صفحتك',
      description: 'أضف أول رابط لصفحتك الشخصية على ركني.',
      href: '/app/links',
    });
  } else if (activeLinks.length === 0) {
    insights.push({
      id: 'no-active-links',
      severity: 'warning',
      title: 'لا توجد روابط نشطة',
      description: 'فعّل رابطاً واحداً على الأقل ليظهر للزوار.',
      href: '/app/links',
    });
  }

  if (!storeStats.hasStore && productStats.totalProducts === 0) {
    insights.push({
      id: 'no-store',
      severity: 'info',
      title: 'أنشئ متجرك',
      description: 'أضف منتجاتك وابدأ باستقبال الطلبات من صفحتك.',
      href: '/app/products',
    });
  } else if (storeStats.hasStore && productStats.totalProducts === 0) {
    insights.push({
      id: 'no-products',
      severity: 'info',
      title: 'أضف منتجاتك الأولى',
      description: 'متجرك جاهز — ابدأ بإضافة منتجات للبيع.',
      href: '/app/products',
    });
  }

  if (orderStats.processingOrders > 0) {
    insights.push({
      id: 'processing-orders',
      severity: 'info',
      title: `${formatNumber(orderStats.processingOrders)} طلب قيد المعالجة`,
      description: 'تابع الشحن والتسليم للطلبات الجارية.',
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
      title: 'أداء ممتاز',
      description: 'صفحتك ومتجرك يعملان بشكل جيد — استمر!',
    });
  }

  return insights.slice(0, 6);
}
