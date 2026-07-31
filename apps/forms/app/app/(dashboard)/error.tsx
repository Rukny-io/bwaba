'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@heroui/react';
import { DashboardErrorState } from '@/components/app/dashboard-error-state';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[forms/dashboard] route error:', error);
  }, [error]);

  return (
    <DashboardErrorState onRetry={() => reset()}>
      <Link href="/app/forms">
        <Button variant="tertiary">النماذج</Button>
      </Link>
    </DashboardErrorState>
  );
}
