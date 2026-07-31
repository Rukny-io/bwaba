'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@heroui/react';
import { DashboardEmptyState } from '@/components/app/dashboard-empty-state';
import { cn } from '@/lib/utils';

export function FormPermissionDeniedState({
  title = 'صلاحية غير كافية',
  description,
  actionHref,
  actionLabel = 'العودة لإعدادات النموذج',
  className,
}: {
  title?: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <DashboardEmptyState
      icon={Lock}
      title={title}
      description={description}
      className={cn(className)}
    >
      {actionHref ? (
        <Link href={actionHref}>
          <Button variant="secondary" className="rounded-full px-5">
            {actionLabel}
          </Button>
        </Link>
      ) : null}
    </DashboardEmptyState>
  );
}
