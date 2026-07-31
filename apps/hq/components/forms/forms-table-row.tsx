'use client';

import { useRouter } from 'next/navigation';
import { ExternalLink, Eye, Inbox } from 'lucide-react';
import { Button, Chip, Table, Tooltip } from '@heroui/react';
import type { AdminForm } from '@/lib/types/forms';
import { FormsTableFormCell } from '@/components/forms/forms-table-form-cell';
import { FormsTableOwnerCell } from '@/components/forms/forms-table-owner-cell';
import { TableHint } from '@/components/shared/table-hint';
import { getFormPreviewUrl } from '@/lib/forms-url';
import {
  formatFormDate,
  formatFormDateTime,
  formatFormMetric,
  formatFormStatus,
  formMetricHint,
  formStatusChipColor,
  formStatusHint,
} from '@/lib/forms-format';
import { cn } from '@/lib/utils';

interface FormsTableRowProps {
  form: AdminForm;
}

const cellTruncate = 'max-w-0 overflow-hidden';

function MetricCell({
  value,
  icon: Icon,
  metric,
}: {
  value: number;
  icon: typeof Inbox;
  metric: 'submissions' | 'views';
}) {
  const display = formatFormMetric(value);
  const isEmpty = value === 0;
  const label = metric === 'submissions' ? 'Submissions' : 'Views';

  return (
    <TableHint content={formMetricHint(metric, value)} ariaLabel={label}>
      <div className="flex items-center justify-end gap-1.5">
        <Icon
          className={cn(
            'size-3.5 shrink-0',
            isEmpty ? 'text-[var(--muted)]' : 'text-[var(--muted-foreground)]',
          )}
          aria-hidden
        />
        <span
          className={cn(
            'text-sm tabular-nums',
            isEmpty
              ? 'text-[var(--muted)]'
              : 'font-medium text-[var(--foreground)]',
          )}
          dir="ltr"
        >
          {display}
        </span>
      </div>
    </TableHint>
  );
}

export function FormsTableRow({ form }: FormsTableRowProps) {
  const router = useRouter();
  const previewUrl = getFormPreviewUrl(form.slug);

  return (
    <Table.Row
      id={form.id}
      textValue={form.title}
      className="group transition-colors hover:bg-[var(--surface-secondary)]/50"
    >
      <Table.Cell className={cn(cellTruncate, 'pe-2')}>
        <FormsTableFormCell form={form} />
      </Table.Cell>

      <Table.Cell className={cn(cellTruncate, 'ps-2')}>
        <FormsTableOwnerCell owner={form.owner} />
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <div className="flex flex-wrap items-center gap-1.5">
          {form.deletedAt ? (
            <Chip color="danger" size="sm" variant="soft">
              Deleted
            </Chip>
          ) : (
            <TableHint content={formStatusHint(form.status)} ariaLabel="Form status">
              <Chip color={formStatusChipColor(form.status)} size="sm" variant="soft">
                {formatFormStatus(form.status)}
              </Chip>
            </TableHint>
          )}
        </div>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <MetricCell value={form.submissionCount} icon={Inbox} metric="submissions" />
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <MetricCell value={form.viewCount} icon={Eye} metric="views" />
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <div className="flex items-center gap-2">
          <TableHint content={`Created ${formatFormDateTime(form.createdAt)}`}>
            <time
              className="shrink-0 cursor-default text-xs text-[var(--muted-foreground)]"
              dateTime={form.createdAt}
            >
              {formatFormDate(form.createdAt)}
            </time>
          </TableHint>
          <Tooltip delay={350}>
            <Button
              size="sm"
              variant="tertiary"
              className="h-7 shrink-0 rounded-lg px-2 opacity-80 transition-opacity group-hover:opacity-100"
              onPress={() => router.push(`/app/forms/${form.id}`)}
            >
              Details
            </Button>
            <Tooltip.Content showArrow className="text-xs">
              <Tooltip.Arrow />
              Open form details in HQ
            </Tooltip.Content>
          </Tooltip>
          <Tooltip delay={350}>
            <Button
              size="sm"
              variant="tertiary"
              className="h-7 shrink-0 rounded-lg px-2 opacity-80 transition-opacity group-hover:opacity-100"
              onPress={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
              aria-label={`Preview ${form.title}`}
            >
              <ExternalLink className="size-3.5" />
              View
            </Button>
            <Tooltip.Content showArrow className="text-xs">
              <Tooltip.Arrow />
              Open public preview in a new tab
            </Tooltip.Content>
          </Tooltip>
        </div>
      </Table.Cell>
    </Table.Row>
  );
}
