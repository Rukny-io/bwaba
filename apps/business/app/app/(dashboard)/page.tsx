import Link from 'next/link';
import {
  Instagram,
  Link2,
  MessageCircle,
  MessagesSquare,
  Settings,
} from 'lucide-react';
import {
  DashboardHomeChannelStatus,
  DashboardHomeConnectedAccounts,
  DashboardHomeRecentConversations,
} from '@/components/app/business-home-panels';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { DashboardQuickAction } from '@/components/app/dashboard-quick-action';
import { getDashboardUser } from '@/lib/dal';
import { getBusinessDashboardHomeData } from '@/lib/business-dashboard-data';

export default async function InboxPage() {
  const [user, home] = await Promise.all([
    getDashboardUser(),
    getBusinessDashboardHomeData(),
  ]);

  const greeting = user.name ?? user.username ?? user.email;
  const { metrics, connectedAccounts, recentConversations } = home;
  const hasInstagram = connectedAccounts.length > 0;

  return (
    <section className="dashboard-page flex flex-col gap-5 sm:gap-6">
      <DashboardPageHeader
        title="لوحة التحكم"
        description={`مرحباً، ${greeting} — نظرة عامة على محادثاتك وقنوات Meta.`}
        actions={
          <Link
            href="/app/instagram"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-[13px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          >
            <Link2 size={15} strokeWidth={2.2} />
            ربط Instagram
          </Link>
        }
      />

      <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 xl:grid-cols-4">
        <DashboardMetricCard
          icon={Instagram}
          label="حسابات Instagram"
          value={metrics.connectedAccounts.value}
          chip={metrics.connectedAccounts.chip}
          chipTone={metrics.connectedAccounts.chipTone}
          comparisonPrimary={metrics.connectedAccounts.comparisonPrimary!}
        />
        <DashboardMetricCard
          icon={MessagesSquare}
          label="رسائل غير مقروءة"
          value={metrics.unreadMessages.value}
          chip={metrics.unreadMessages.chip}
          chipTone={metrics.unreadMessages.chipTone}
          comparisonPrimary={metrics.unreadMessages.comparisonPrimary!}
        />
        <DashboardMetricCard
          icon={MessageCircle}
          label="محادثات مفتوحة"
          value={metrics.openThreads.value}
          chip={metrics.openThreads.chip}
          chipTone={metrics.openThreads.chipTone}
          comparisonPrimary={metrics.openThreads.comparisonPrimary!}
        />
        <DashboardMetricCard
          icon={Settings}
          label="القنوات النشطة"
          value={metrics.channelsReady.value}
          tabular={metrics.channelsReady.tabular}
          chip={metrics.channelsReady.chip}
          chipTone={metrics.channelsReady.chipTone}
          comparisonPrimary={metrics.channelsReady.comparisonPrimary!}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-3.5 lg:grid-cols-3 lg:gap-4">
        <DashboardHomeConnectedAccounts accounts={connectedAccounts} />
        <DashboardHomeRecentConversations
          conversations={recentConversations}
          hasInstagramAccounts={hasInstagram}
        />
        <DashboardHomeChannelStatus hasInstagram={hasInstagram} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-3 lg:gap-4">
        <DashboardQuickAction
          href="/app/inbox"
          icon={MessagesSquare}
          title="صندوق الوارد"
          description="Instagram و Messenger في واجهة واحدة."
        />
        <DashboardQuickAction
          href="/app/instagram"
          icon={Instagram}
          title="Instagram"
          description="اربط حسابات Professional وادِر الاتصالات."
        />
        <DashboardQuickAction
          href="/app/messenger"
          icon={MessageCircle}
          title="Messenger"
          description="ربط صفحات Facebook — قريباً."
        />
        <DashboardQuickAction
          href="/app/settings"
          icon={Settings}
          title="الإعدادات"
          description="إعدادات الحساب وتفضيلات Business Hub."
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>
    </section>
  );
}
