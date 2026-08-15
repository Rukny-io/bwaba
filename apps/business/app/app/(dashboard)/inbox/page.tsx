import { Suspense } from 'react';
import { UnifiedInboxPanel } from '@/components/inbox/unified-inbox-panel';

function InboxFallback() {
  return (
    <section className="dashboard-section-stack py-12 text-center">
      <p className="text-[13px] text-[var(--muted-foreground)]">جارٍ تحميل صندوق الوارد…</p>
    </section>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={<InboxFallback />}>
      <UnifiedInboxPanel />
    </Suspense>
  );
}
