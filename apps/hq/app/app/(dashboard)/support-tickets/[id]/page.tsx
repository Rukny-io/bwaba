import { Suspense } from 'react';
import { getDashboardUser } from '@/lib/dal';
import { SupportTicketDetailView } from '@/components/support-tickets/support-ticket-detail-view';

export default async function SupportTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await getDashboardUser();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      }
    >
      <SupportTicketDetailView ticketId={id} currentAdminId={admin.id} />
    </Suspense>
  );
}
