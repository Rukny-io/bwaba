'use client';

import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { Button } from '@heroui/react';
import { APP_BASE } from '@/components/app/nav-config';
import { cn } from '@/lib/utils';

export function ComposeMailButton({
  className,
  showLabel = true,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <Link href={`${APP_BASE}/mail/compose`} className={cn('inline-flex', className)}>
      <Button variant="primary" size="sm" className="gap-1.5">
        <PenLine size={15} strokeWidth={2.2} />
        {showLabel ? <span>رسالة جديدة</span> : null}
      </Button>
    </Link>
  );
}
