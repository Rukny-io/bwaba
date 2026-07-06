import { SubmissionsView } from '@/components/forms/submissions/submissions-view';

export default async function FormSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SubmissionsView formId={id} />;
}
