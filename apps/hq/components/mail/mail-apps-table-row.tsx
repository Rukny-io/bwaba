'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import { Button, Chip, Table, Tooltip } from '@heroui/react';
import type { AdminMailApp } from '@/lib/types/mail';
import { FormsTableOwnerCell } from '@/components/forms/forms-table-owner-cell';
import { TableHint } from '@/components/shared/table-hint';
import {
  formatMailAppStatus,
  formatMailDate,
  formatMailDateTime,
  formatMailDomainStatus,
  formatMailPlan,
  formatMailStorageRatio,
  mailAppStatusChipColor,
  mailDomainStatusChipColor,
} from '@/lib/mail-format';
import { cn } from '@/lib/utils';

const cellTruncate = 'max-w-0 overflow-hidden';

export function MailAppsTableRow({ app }: { app: AdminMailApp }) {
  const router = useRouter();
  const detailHref = `/app/mail/${app.appId}`;

  return (
    <Table.Row
      id={app.appId}
      textValue={app.name}
      className="group cursor-pointer transition-colors hover:bg-[var(--surface-secondary)]/50"
    >
      <Table.Cell className={cn(cellTruncate, 'pe-2')}>
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <Mail className="size-3.5" aria-hidden />
          </div>
          <div className="min-w-0">
            <Link
              href={detailHref}
              className="block truncate text-sm font-medium leading-snug text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
              title={`Open details for ${app.name}`}
            >
              {app.name}
            </Link>
            <p
              className="truncate font-mono text-[11px] leading-snug text-[var(--muted-foreground)]"
              dir="ltr"
            >
              {app.appId}
            </p>
          </div>
        </div>
      </Table.Cell>

      <Table.Cell className={cn(cellTruncate, 'ps-2')}>
        <FormsTableOwnerCell owner={app.owner} />
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <span className="text-xs text-[var(--foreground)]" dir="ltr">
          {app.primaryDomain ?? '—'}
        </span>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <Chip color={mailDomainStatusChipColor(app.domainStatus)} size="sm" variant="soft">
          {formatMailDomainStatus(app.domainStatus)}
        </Chip>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <span className="text-xs">{formatMailPlan(app.subscription?.plan)}</span>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <span className="text-sm tabular-nums">{app.mailboxCount}</span>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <TableHint content={formatMailStorageRatio(app.storageUsedBytes, app.storageQuotaBytes)}>
          <span className="text-xs tabular-nums text-[var(--muted-foreground)]" dir="ltr">
            {formatMailStorageRatio(app.storageUsedBytes, app.storageQuotaBytes)}
          </span>
        </TableHint>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Chip color={mailAppStatusChipColor(app.status)} size="sm" variant="soft">
            {formatMailAppStatus(app.status)}
          </Chip>
          <TableHint content={`Created ${formatMailDateTime(app.createdAt)}`}>
            <time
              className="shrink-0 cursor-default text-xs text-[var(--muted-foreground)]"
              dateTime={app.createdAt}
            >
              {formatMailDate(app.createdAt)}
            </time>
          </TableHint>
        </div>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <Tooltip delay={350}>
            <Button
              size="sm"
              variant="tertiary"
              className="h-7 shrink-0 rounded-lg px-2"
              onPress={() => router.push(detailHref)}
            >
              Details
            </Button>
            <Tooltip.Content showArrow className="text-xs">
              <Tooltip.Arrow />
              Open app details
            </Tooltip.Content>
          </Tooltip>
          <Tooltip delay={350}>
            <Button
              size="sm"
              variant="tertiary"
              className="h-7 shrink-0 rounded-lg px-2"
              onPress={() => router.push(`${detailHref}?tab=analytics`)}
            >
              Analytics
            </Button>
            <Tooltip.Content showArrow className="text-xs">
              <Tooltip.Arrow />
              Open app analytics
            </Tooltip.Content>
          </Tooltip>
        </div>
      </Table.Cell>
    </Table.Row>
  );
}
