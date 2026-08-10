'use client';

import { useRouter } from 'next/navigation';
import { ExternalLink, Package, ShoppingCart } from 'lucide-react';
import { Button, Chip, Table, Tooltip } from '@heroui/react';
import type { AdminStore } from '@/lib/types/stores';
import { StoresTableStoreCell } from '@/components/stores/stores-table-store-cell';
import { StoresTableOwnerCell } from '@/components/stores/stores-table-owner-cell';
import { TableHint } from '@/components/shared/table-hint';
import { getStorePublicUrl } from '@/lib/stores-url';
import {
  formatStoreDate,
  formatStoreDateTime,
  formatStoreMetric,
  formatStoreStatus,
  storeStatusChipColor,
  storeStatusHint,
} from '@/lib/stores-format';
import { cn } from '@/lib/utils';

interface StoresTableRowProps {
  store: AdminStore;
}

const cellTruncate = 'max-w-0 overflow-hidden';

function CountCell({
  value,
  icon: Icon,
  label,
}: {
  value: number;
  icon: typeof Package;
  label: string;
}) {
  const display = formatStoreMetric(value);
  const isEmpty = value === 0;

  return (
    <TableHint
      content={isEmpty ? `No ${label.toLowerCase()} yet` : `${value.toLocaleString('en-US')} ${label.toLowerCase()}`}
      ariaLabel={label}
    >
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

export function StoresTableRow({ store }: StoresTableRowProps) {
  const router = useRouter();
  const publicUrl = getStorePublicUrl(store.slug);
  const category = store.store_categories;

  return (
    <Table.Row
      id={store.id}
      textValue={store.name}
      className="group transition-colors hover:bg-[var(--surface-secondary)]/50"
    >
      <Table.Cell className={cn(cellTruncate, 'pe-2')}>
        <StoresTableStoreCell store={store} />
      </Table.Cell>

      <Table.Cell className={cn(cellTruncate, 'ps-2')}>
        <StoresTableOwnerCell owner={store.user} />
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        {category ? (
          <Chip
            size="sm"
            variant="soft"
            style={{ backgroundColor: `${category.color}22`, color: category.color }}
          >
            <span className="max-w-[8rem] truncate">{category.nameAr}</span>
          </Chip>
        ) : (
          <span className="text-xs text-[var(--muted-foreground)]">—</span>
        )}
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <span className="text-sm text-[var(--foreground)]">
          {store.city ?? '—'}
        </span>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <TableHint content={storeStatusHint(store.status)} ariaLabel="Store status">
          <Chip color={storeStatusChipColor(store.status)} size="sm" variant="soft">
            {formatStoreStatus(store.status)}
          </Chip>
        </TableHint>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <CountCell value={store._count.products} icon={Package} label="Products" />
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <CountCell value={store._count.orders} icon={ShoppingCart} label="Orders" />
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <div className="flex items-center gap-2">
          <TableHint content={`Created ${formatStoreDateTime(store.createdAt)}`}>
            <time
              className="shrink-0 cursor-default text-xs text-[var(--muted-foreground)]"
              dateTime={store.createdAt}
            >
              {formatStoreDate(store.createdAt)}
            </time>
          </TableHint>
          <Tooltip delay={350}>
            <Button
              size="sm"
              variant="tertiary"
              className="h-7 shrink-0 rounded-lg px-2 opacity-80 transition-opacity group-hover:opacity-100"
              onPress={() => router.push(`/app/stores/${store.id}`)}
            >
              Details
            </Button>
            <Tooltip.Content showArrow className="text-xs">
              <Tooltip.Arrow />
              Open store details in HQ
            </Tooltip.Content>
          </Tooltip>
          <Tooltip delay={350}>
            <Button
              size="sm"
              variant="tertiary"
              className="h-7 shrink-0 rounded-lg px-2 opacity-80 transition-opacity group-hover:opacity-100"
              onPress={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
              aria-label={`View ${store.name}`}
            >
              <ExternalLink className="size-3.5" />
              View
            </Button>
            <Tooltip.Content showArrow className="text-xs">
              <Tooltip.Arrow />
              Open public storefront in a new tab
            </Tooltip.Content>
          </Tooltip>
        </div>
      </Table.Cell>
    </Table.Row>
  );
}
