import { Suspense } from 'react';
import { Skeleton } from '@heroui/react';
import { FormIntegrationsView } from '@/components/forms/integrations/form-integrations-view';

function IntegrationsFallback() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <Skeleton className="h-5 w-64 max-w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-44 rounded-2xl sm:rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export default async function FormIntegrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<IntegrationsFallback />}>
      <FormIntegrationsView formId={id} />
    </Suspense>
  );
}
