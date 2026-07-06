'use client';

import { ProgressBar } from '@heroui/react';
import { cn } from '@/lib/utils';

export function FormProgressBar({
  value,
  className,
  'aria-label': ariaLabel = 'تقدّم النموذج',
}: {
  value: number;
  className?: string;
  'aria-label'?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <ProgressBar
      aria-label={ariaLabel}
      value={clamped}
      maxValue={100}
      className={cn('form-heroui-progress w-full', className)}
    >
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  );
}
