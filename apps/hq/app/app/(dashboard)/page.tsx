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
import { VerificationAlert } from '@/components/dashboard/verification-alert';
import { DashboardQuickAction } from '@/components/dashboard/dashboard-quick-action';
import { DashboardRecentActivity } from '@/components/dashboard/dashboard-recent-activity';
import { APP_BASE } from '@/components/layout/nav-config';
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
  LifeBuoy,
} from 'lucide-react';

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
      {children}
    </h2>
  );
}

export default async function DashboardHomePage() {
  const [admin, data] = await Promise.all([
    getDashboardUser(),
    getHqDashboardData(),
  ]);

  const greeting = admin.name ?? admin.username ?? admin.email;
  const { platform, users, orders, verification, health, commerce, recentActivity } =
    data;
  const mail = platform.mail ?? { total: 0, active: 0 };

  const activeRate =
    users.total > 0
      ? Math.round((users.activeToday / users.total) * 100)
      : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          Dashboard
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
          Welcome, {greeting} — an overview of the Rukny platform.
        </p>
      </header>

      <VerificationAlert stats={verification} />

      <section className="space-y-3">
        <SectionTitle>Shortcuts</SectionTitle>
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          <DashboardQuickAction
            href={`${APP_BASE}/users`}
            icon={Users}
            title="Users"
            description="Accounts, roles, and verification"
          />
          <DashboardQuickAction
            href={`${APP_BASE}/stores`}
            icon={Store}
            title="Stores"
            description="Merchant storefronts and status"
          />
          <DashboardQuickAction
            href={`${APP_BASE}/support-tickets`}
            icon={LifeBuoy}
            title="Support"
            description="Tickets and customer requests"
          />
          <DashboardQuickAction
            href={`${APP_BASE}/orders`}
            icon={ShoppingCart}
            title="Orders"
            description="Commerce and billing activity"
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Users</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <DashboardMetricCard
            href={`${APP_BASE}/users`}
            icon={Users}
            label="Total users"
            value={formatNumber(users.total)}
            trend={users.today > 0 ? `+${users.today}` : undefined}
            trendPositive
            comparisonPrimary={`${formatNumber(users.thisMonth)} new this month`}
            comparisonSecondary={`${formatPercent(users.verificationRate)} verified email`}
          />
          <DashboardMetricCard
            href={`${APP_BASE}/users`}
            icon={UserCheck}
            label="Active today"
            value={formatNumber(users.activeToday)}
            trend={activeRate > 0 ? `${activeRate}%` : undefined}
            trendPositive
            comparisonPrimary="Signed in today"
            comparisonSecondary={`of ${formatNumber(users.total)} users`}
          />
          <DashboardMetricCard
            href={`${APP_BASE}/users`}
            icon={UserPlus}
            label="New users"
            value={formatNumber(users.thisWeek)}
            comparisonPrimary={`${formatNumber(users.today)} today`}
            comparisonSecondary={`${formatNumber(users.thisMonth)} this month`}
          />
          <DashboardMetricCard
            href={`${APP_BASE}/stores`}
            icon={Store}
            label="Active stores"
            value={formatNumber(platform.stores.active)}
            comparisonPrimary={`of ${formatNumber(platform.stores.total)} stores`}
            comparisonSecondary="ACTIVE status"
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Platform</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <DashboardMetricCard
            href={`${APP_BASE}/forms`}
            icon={FileText}
            label="Published forms"
            value={formatNumber(platform.forms.active)}
            comparisonPrimary={`of ${formatNumber(platform.forms.total)} forms`}
          />
          <DashboardMetricCard
            href={`${APP_BASE}/mail`}
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
            href={`${APP_BASE}/orders`}
            icon={ShoppingCart}
            label="Total orders"
            value={formatNumber(orders.total)}
            trend={orders.today > 0 ? `+${orders.today}` : undefined}
            trendPositive
            comparisonPrimary={`${formatNumber(orders.thisMonth)} this month`}
          />
          <DashboardMetricCard
            href={`${APP_BASE}/orders`}
            icon={Banknote}
            label="Monthly revenue"
            value={formatCurrency(orders.revenue.thisMonth)}
            comparisonPrimary={`${formatCurrency(orders.revenue.today)} today`}
            comparisonSecondary={`avg ${formatCurrency(orders.averageOrderValue)}`}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CommerceAnalyticsPanel initialData={commerce} />
        </div>
        <div className="flex flex-col gap-4">
          <SystemHealthPanel health={health} />
          <DashboardRecentActivity items={recentActivity} />
        </div>
      </div>
    </div>
  );
}
