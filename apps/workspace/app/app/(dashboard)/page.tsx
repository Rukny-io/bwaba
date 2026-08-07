import { Globe, Inbox, Mail } from 'lucide-react';
import {
  DashboardHomeActivity,
  DashboardHomeRecentDomains,
  DashboardHomeRecentMessages,
} from '@/components/app/dashboard-home-panels';
import { ComposeMailButton } from '@/components/app/compose-mail-button';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { DashboardQuickAction } from '@/components/app/dashboard-quick-action';
import { APP_BASE } from '@/components/app/nav-config';
import { getDashboardUser } from '@/lib/dal';
import { getWorkspaceDashboardHomeData } from '@/lib/workspace-dashboard-data';

export default async function AppHomePage() {
  const [user, home] = await Promise.all([
    getDashboardUser(),
    getWorkspaceDashboardHomeData(),
  ]);
  const greeting = user.name ?? user.email;
  const { metrics, recentDomains, recentMessages, recentActivity } = home;

  return (
    <section className="dashboard-page flex flex-col gap-5 sm:gap-6 dashboard-brand">
      <DashboardPageHeader
        title="لوحة التحكم"
        description={`مرحباً، ${greeting} — نظرة عامة على بريدك ودوميناتك.`}
        actions={<ComposeMailButton className="hidden sm:inline-flex" />}
      />

      <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <DashboardMetricCard
          icon={Globe}
          label="الدومينات المربوطة"
          value={metrics.linkedDomains.value}
          chip={metrics.linkedDomains.chip}
          chipTone={metrics.linkedDomains.chipTone}
          comparisonPrimary="دومينات مُحقَّقة"
          comparisonSecondary="جاهزة للبريد"
        />
        <DashboardMetricCard
          icon={Mail}
          label="صناديق البريد"
          value={metrics.mailboxes.value}
          chip={metrics.mailboxes.chip}
          chipTone={metrics.mailboxes.chipTone}
          comparisonPrimary="صناديق نشطة"
          comparisonSecondary="في باقتك الحالية"
        />
        <DashboardMetricCard
          icon={Inbox}
          label="رسائل غير مقروءة"
          value={metrics.unreadMessages.value}
          chip={metrics.unreadMessages.chip}
          chipTone={metrics.unreadMessages.chipTone}
          comparisonPrimary="في صندوق الوارد"
          comparisonSecondary="بانتظار الرد"
        />
        <DashboardMetricCard
          icon={Mail}
          label="معدل التسليم"
          value={metrics.deliveryRate.value}
          chip={metrics.deliveryRate.chip}
          chipTone={metrics.deliveryRate.chipTone}
          tabular={false}
          comparisonPrimary="إرسال ناجح"
          comparisonSecondary="آخر 30 يوماً"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
        <DashboardHomeRecentDomains domains={recentDomains} />
        <DashboardHomeRecentMessages messages={recentMessages} />
        <DashboardHomeActivity items={recentActivity} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <DashboardQuickAction
          href={`${APP_BASE}/domains`}
          icon={Globe}
          title="ربط دومين"
          description="أضف دومينك وتحقق من سجلات MX و SPF و DKIM."
        />
        <DashboardQuickAction
          href={`${APP_BASE}/mailboxes`}
          icon={Mail}
          title="صناديق البريد"
          description="أنشئ حتى 3 صناديق بريد مخصصة على دومينك."
        />
        <DashboardQuickAction
          href={`${APP_BASE}/mail`}
          icon={Inbox}
          title="صندوق الوارد"
          description="استقبل ورد على رسائل عملائك من مكان واحد."
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>
    </section>
  );
}
