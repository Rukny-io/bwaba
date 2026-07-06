import { Chip } from '@heroui/react';
import { getFormStatusLabel } from '@/lib/forms-format';
import type { FormStatus } from '@/lib/forms-api';
import { cn } from '@/lib/utils';

const STATUS_CLASS: Record<FormStatus, string> = {
  DRAFT: 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
  PUBLISHED: 'bg-[var(--success)]/15 text-[var(--success)]',
  CLOSED: 'bg-[var(--warning)]/15 text-[var(--warning)]',
  ARCHIVED: 'bg-[var(--muted-foreground)]/15 text-[var(--muted-foreground)]',
};

export function FormStatusChip({
  status,
  className,
}: {
  status: FormStatus;
  className?: string;
}) {
  return (
    <Chip
      size="sm"
      className={cn('font-medium', STATUS_CLASS[status], className)}
    >
      {getFormStatusLabel(status)}
    </Chip>
  );
}
