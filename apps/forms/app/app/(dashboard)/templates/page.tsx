import { Suspense } from 'react';
import { TemplatesView } from '@/components/templates/templates-view';
import { TemplatesGridSkeleton } from '@/components/templates/templates-grid-skeleton';

export default function TemplatesPage() {
  return (
    <section className="dashboard-page">
      <Suspense fallback={<TemplatesGridSkeleton count={6} />}>
        <TemplatesView />
      </Suspense>
    </section>
  );
}
