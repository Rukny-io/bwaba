import { Suspense } from 'react';
import { getDashboardUser } from '@/lib/dal';
import { UserDetailView } from '@/components/users/user-detail-view';

export default async function UserDetailPage({
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
      <UserDetailView userId={id} currentAdminId={admin.id} />
    </Suspense>
  );
}
