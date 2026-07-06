import { ArrowLeft, BarChart2, FileText, Inbox, LayoutTemplate, Plus } from 'lucide-react';
import Link from 'next/link';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import { getDashboardUser } from '@/lib/dal';
import { getFormsDashboardMetrics } from '@/lib/forms-dashboard-data';

export default async function AppHomePage() {
  const [user, metrics] = await Promise.all([
    getDashboardUser(),
    getFormsDashboardMetrics(),
  ]);
  const greeting = user.name ?? user.email;

  return (
    <section className="dashboard-page">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          لوحة التحكم
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
          مرحباً، {greeting} — نظرة عامة على نماذجك واستجاباتك.
        </p>
      </div>

      {/* Metric cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 xl:grid-cols-4">
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

      {/* Quick action cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        <Link
          href="/app/forms"
          className="group dashboard-card dashboard-card-interactive flex items-center gap-4 rounded-2xl p-4 sm:rounded-3xl sm:p-5"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--background)]">
            <FileText size={18} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              نماذجي
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
              عرض وإدارة جميع النماذج التي أنشأتها.
            </p>
          </div>
          <ArrowLeft
            size={16}
            className="shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:-translate-x-0.5"
          />
        </Link>

        <Link
          href="/app/templates"
          className="group dashboard-card dashboard-card-interactive flex items-center gap-4 rounded-2xl p-4 sm:rounded-3xl sm:p-5"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/12 text-[var(--primary)]">
            <LayoutTemplate size={18} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              ابدأ من قالب
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
              مكتبة قوالب جاهزة — تواصل، استبيان، تسجيل، والمزيد.
            </p>
          </div>
          <ArrowLeft
            size={16}
            className="shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:-translate-x-0.5"
          />
        </Link>

        <Link
          href="/forms/n/new"
          className="group dashboard-card dashboard-card-interactive flex items-center gap-4 rounded-2xl p-4 sm:col-span-2 sm:rounded-3xl sm:p-5 lg:col-span-1"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/12 text-[var(--primary)]">
            <Plus size={18} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              إنشاء نموذج
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
              ابدأ نموذجاً جديداً من الصفر أو من قالب جاهز.
            </p>
          </div>
          <ArrowLeft
            size={16}
            className="shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:-translate-x-0.5"
          />
        </Link>
      </div>
    </section>
  );
}
