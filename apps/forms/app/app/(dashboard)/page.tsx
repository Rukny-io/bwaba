import Link from 'next/link';
import {
  BarChart2,
  FileText,
  Inbox,
  LayoutTemplate,
  Plus,
} from 'lucide-react';
import {
  DashboardHomeActivity,
  DashboardHomeRecentForms,
  DashboardHomeRecentSubmissions,
} from '@/components/app/dashboard-home-panels';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { DashboardQuickAction } from '@/components/app/dashboard-quick-action';
import { getDashboardUser } from '@/lib/dal';
import { getFormsDashboardHomeData } from '@/lib/forms-dashboard-data';
import { FORMS_CREATE_ENTRY_PATH } from '@/lib/forms-paths';

export default async function AppHomePage() {
  const [user, home] = await Promise.all([
    getDashboardUser(),
    getFormsDashboardHomeData(),
  ]);
  const greeting = user.name ?? user.email;
  const { metrics, recentForms, recentSubmissions, recentActivity } = home;

  return (
    <section className="dashboard-page flex flex-col gap-5 sm:gap-6">
      <DashboardPageHeader
        title="لوحة التحكم"
        description={`مرحباً، ${greeting} — نظرة عامة على نماذجك واستجاباتك.`}
        actions={
          <Link
            href={FORMS_CREATE_ENTRY_PATH}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-[13px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          >
            <Plus size={15} strokeWidth={2.2} />
            إنشاء نموذج
          </Link>
        }
      />

      <div className="grid auto-rows-fr grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <DashboardMetricCard
          icon={FileText}
          label="النماذج النشطة"
          value={metrics.activeForms.value}
          trend={metrics.activeForms.trend}
          trendPositive={metrics.activeForms.trendPositive}
          comparisonPrimary="نماذج منشورة"
          comparisonSecondary="مقابل الشهر الماضي"
        />
        <DashboardMetricCard
          icon={Inbox}
          label="إجمالي الاستجابات"
          value={metrics.submissions.value}
          trend={metrics.submissions.trend}
          trendPositive={metrics.submissions.trendPositive}
          comparisonPrimary="استجابات"
          comparisonSecondary="مقابل الشهر الماضي"
        />
        <DashboardMetricCard
          icon={LayoutTemplate}
          label="نماذج مخصّصة"
          value={metrics.themedForms.value}
          trend={metrics.themedForms.trend}
          trendPositive={metrics.themedForms.trendPositive}
          comparisonPrimary="بتصميم مخصص"
          comparisonSecondary="من إجمالي نماذجك"
        />
        <DashboardMetricCard
          icon={BarChart2}
          label="معدل الإكمال"
          value={metrics.completionRate.value}
          trend={metrics.completionRate.trend}
          trendPositive={metrics.completionRate.trendPositive}
          comparisonPrimary="إكمال"
          comparisonSecondary="مقابل الشهر الماضي"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-3.5 lg:grid-cols-3 lg:gap-4">
        <DashboardHomeRecentForms forms={recentForms} />
        <DashboardHomeRecentSubmissions items={recentSubmissions} />
        <DashboardHomeActivity items={recentActivity} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-3 lg:gap-4">
        <DashboardQuickAction
          href="/app/forms"
          icon={FileText}
          title="نماذجي"
          description="عرض وإدارة جميع النماذج التي أنشأتها."
        />
        <DashboardQuickAction
          href="/app/templates"
          icon={LayoutTemplate}
          title="ابدأ من قالب"
          description="مكتبة قوالب جاهزة — تواصل، استبيان، تسجيل، والمزيد."
        />
        <DashboardQuickAction
          href={FORMS_CREATE_ENTRY_PATH}
          icon={Plus}
          title="إنشاء نموذج"
          description="ابدأ نموذجاً جديداً من الصفر أو من قالب جاهز."
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>
    </section>
  );
}
