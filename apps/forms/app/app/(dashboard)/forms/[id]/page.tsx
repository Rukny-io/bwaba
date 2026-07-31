import { FormDetailView } from '@/components/forms/form-detail/form-detail-view';

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FormDetailView formId={id} />;
}
