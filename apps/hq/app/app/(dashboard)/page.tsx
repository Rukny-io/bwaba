import { getDashboardUser } from '@/lib/dal';
import { getHqDashboardData } from '@/lib/hq-dashboard-data';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '@/lib/dashboard-format';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { CommerceAnalyticsPanel } from '@/components/dashboard/commerce-analytics-panel';
import { SystemHealthPanel } from '@/components/dashboard/system-health-panel';
import { PlatformBreakdown } from '@/components/dashboard/platform-breakdown';
import { VerificationAlert } from '@/components/dashboard/verification-alert';
import {
  Users,
  UserCheck,
  UserPlus,
  Store,
  FileText,
  Calendar,
  ShoppingCart,
  Banknote,
  Mail,
} from 'lucide-react';

export default async function DashboardHomePage() {
  const [admin, data] = await Promise.all([
    getDashboardUser(),
    getHqDashboardData(),
  ]);

  const greeting = admin.name ?? admin.username ?? admin.email;
  const { platform, users, orders, verification, health, commerce } = data;
  const mail = platform.mail ?? { total: 0, active: 0 };

  const activeRate =
    users.total > 0
      ? Math.round((users.activeToday / users.total) * 100)
      : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          App
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
          Welcome, {greeting} — an overview of the Rukny platform.
        </p>
      </header>

      <VerificationAlert stats={verification} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <DashboardMetricCard
          icon={Users}
          label="Total users"
          value={formatNumber(users.total)}
          trend={users.today > 0 ? `+${users.today}` : undefined}
          trendPositive
          comparisonPrimary={`${formatNumber(users.thisMonth)} new this month`}
          comparisonSecondary={`${formatPercent(users.verificationRate)} verified email`}
        />
        <DashboardMetricCard
          icon={UserCheck}
          label="Active today"
          value={formatNumber(users.activeToday)}
          trend={activeRate > 0 ? `${activeRate}%` : undefined}
          trendPositive
          comparisonPrimary="Signed in today"
          comparisonSecondary={`of ${formatNumber(users.total)} users`}
        />
        <DashboardMetricCard
          icon={UserPlus}
          label="New users"
          value={formatNumber(users.thisWeek)}
          comparisonPrimary={`${formatNumber(users.today)} today`}
          comparisonSecondary={`${formatNumber(users.thisMonth)} this month`}
        />
        <DashboardMetricCard
          icon={Store}
          label="Active stores"
          value={formatNumber(platform.stores.active)}
          comparisonPrimary={`of ${formatNumber(platform.stores.total)} stores`}
          comparisonSecondary="ACTIVE status"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <DashboardMetricCard
          icon={FileText}
          label="Published forms"
          value={formatNumber(platform.forms.active)}
          comparisonPrimary={`of ${formatNumber(platform.forms.total)} forms`}
        />
        <DashboardMetricCard
          icon={Mail}
          label="Mail apps"
          value={formatNumber(mail.active)}
          comparisonPrimary={`of ${formatNumber(mail.total)} apps`}
          comparisonSecondary="ACTIVE status"
        />
        <DashboardMetricCard
          icon={Calendar}
          label="Active events"
          value={formatNumber(platform.events.active)}
          comparisonPrimary={`of ${formatNumber(platform.events.total)} events`}
        />
        <DashboardMetricCard
          icon={ShoppingCart}
          label="Total orders"
          value={formatNumber(orders.total)}
          trend={orders.today > 0 ? `+${orders.today}` : undefined}
          trendPositive
          comparisonPrimary={`${formatNumber(orders.thisMonth)} this month`}
        />
        <DashboardMetricCard
          icon={Banknote}
          label="Monthly revenue"
          value={formatCurrency(orders.revenue.thisMonth)}
          comparisonPrimary={`${formatCurrency(orders.revenue.today)} today`}
          comparisonSecondary={`avg ${formatCurrency(orders.averageOrderValue)}`}
        />
      </div>

      <PlatformBreakdown platform={platform} orders={orders} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CommerceAnalyticsPanel initialData={commerce} />
        </div>
        <SystemHealthPanel health={health} />
      </div>
    </div>
  );
}
