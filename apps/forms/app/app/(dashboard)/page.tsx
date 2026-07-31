import { BarChart2, FileText, Inbox, LayoutTemplate, Plus } from 'lucide-react';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { DashboardQuickAction } from '@/components/app/dashboard-quick-action';
import { getDashboardUser } from '@/lib/dal';
import { getFormsDashboardMetrics } from '@/lib/forms-dashboard-data';

export default async function AppHomePage() {
  const [user, metrics] = await Promise.all([
    getDashboardUser(),
    getFormsDashboardMetrics(),
  ]);
  const greeting = user.name ?? user.email;

  return (
    <section className="dashboard-page dashboard-section-stack">
      <DashboardPageHeader
        title="لوحة التحكم"
        description={`مرحباً، ${greeting} — نظرة عامة على نماذجك واستجاباتك.`}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
          href="/forms/n/new"
          icon={Plus}
          title="إنشاء نموذج"
          description="ابدأ نموذجاً جديداً من الصفر أو من قالب جاهز."
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>
    </section>
  );
}
