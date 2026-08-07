'use client';

import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { Button } from '@heroui/react';
import { WorkspaceNavActions } from '@/components/app/workspace-nav-actions';
import { cn } from '@/lib/utils';

export function DashboardNav() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20">
      <div className="pointer-events-auto flex items-center justify-end gap-2 px-3 pt-2.5 pb-1.5 sm:px-6 lg:pt-4">
        <Link href="/app/mail/compose" className={cn('sm:hidden')}>
          <Button variant="primary" size="sm" className="gap-1.5">
            <PenLine size={15} strokeWidth={2} />
            رسالة جديدة
          </Button>
        </Link>
        <WorkspaceNavActions />
      </div>
    </header>
  );
}
