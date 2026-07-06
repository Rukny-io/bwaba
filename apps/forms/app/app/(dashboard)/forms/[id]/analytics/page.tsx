import { FormAnalyticsView } from '@/components/forms/form-analytics/form-analytics-view';

export default async function FormAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FormAnalyticsView formId={id} />;
}
