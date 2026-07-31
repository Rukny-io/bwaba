'use client';

import { BadgeCheck } from 'lucide-react';
import { TableHint } from '@/components/shared/table-hint';
import { cn } from '@/lib/utils';

interface UserVerificationBadgeProps {
  isRuknyVerified?: boolean;
  verificationLevel?: number;
  className?: string;
}

export function UserVerificationBadge({
  isRuknyVerified,
  verificationLevel = 0,
  className,
}: UserVerificationBadgeProps) {
  if (isRuknyVerified) {
    return (
      <TableHint content="Rukny verified account" ariaLabel="Rukny verified">
        <BadgeCheck
          className={cn('size-3.5 shrink-0 text-[var(--primary)]', className)}
          aria-hidden
        />
      </TableHint>
    );
  }

  if (verificationLevel >= 3) {
    return (
      <TableHint content="Identity verified (ID level)" ariaLabel="ID verified">
        <BadgeCheck
          className={cn('size-3.5 shrink-0 text-[var(--success)]', className)}
          aria-hidden
        />
      </TableHint>
    );
  }

  return null;
}
