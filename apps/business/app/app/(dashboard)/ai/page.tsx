import {
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardSurface,
} from '@/components/app/dashboard-primitives';

export default function AiPage() {
  return (
    <div className="dashboard-section-stack">
      <DashboardPageHeader
        title="الذكاء الاصطناعي"
        description="مساعد ذكي للرد على المحادثات واقتراح الردود — قريباً في Business Hub."
      />

      <DashboardSurface className="p-5 sm:p-6">
        <DashboardEmptyState
          title="قريباً"
          description="اقتراحات الرد، التلخيص، وتصنيف المحادثات تلقائياً — ضمن نفس صندوق الوارد."
        />
      </DashboardSurface>
    </div>
  );
}
