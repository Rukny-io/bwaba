'use client';

import { useId, useMemo, useRef, useState } from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleX,
  ListFilter,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslations } from '@/components/providers/translations-provider';
import type { MessageLogEntry } from '@/lib/api/types';
import { cn } from '@/lib/utils';

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function logStatusVariant(status: string) {
  if (status === 'FAILED') return 'destructive' as const;
  if (status === 'DELIVERED' || status === 'READ') return 'success' as const;
  return 'secondary' as const;
}

export function WhatsappLogsDataTable({
  data,
  page,
  totalPages,
  onPageChange,
}: {
  data: MessageLogEntry[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const id = useId();
  const w = useTranslations().whatsapp;
  const inputRef = useRef<HTMLInputElement>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);

  const columns = useMemo<ColumnDef<MessageLogEntry>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: w.logDate,
        cell: ({ row }) => (
          <span className="tabular-nums text-[13px]" dir="ltr">
            {formatWhen(row.original.createdAt)}
          </span>
        ),
        size: 180,
      },
      {
        accessorKey: 'direction',
        header: w.logDirection,
        cell: ({ row }) =>
          row.original.direction === 'OUTBOUND' ? w.outbound : w.inbound,
        size: 110,
      },
      {
        accessorKey: 'messageType',
        header: w.logType,
        cell: ({ row }) => (
          <span className="font-mono text-[12.5px]" dir="ltr">
            {row.original.messageType}
          </span>
        ),
        size: 120,
        filterFn: (row, _id, value) => {
          const q = String(value ?? '')
            .toLowerCase()
            .trim();
          if (!q) return true;
          const t = row.original;
          return `${t.messageType} ${t.recipientNumber ?? ''} ${t.senderNumber ?? ''} ${t.status}`
            .toLowerCase()
            .includes(q);
        },
      },
      {
        id: 'recipient',
        header: w.logRecipient,
        accessorFn: (row) => row.recipientNumber || row.senderNumber || '—',
        cell: ({ getValue }) => (
          <span className="font-mono text-[13px]" dir="ltr">
            {String(getValue())}
          </span>
        ),
        size: 160,
      },
      {
        accessorKey: 'status',
        header: w.logStatus,
        cell: ({ row }) => (
          <Badge variant={logStatusVariant(row.original.status)}>{row.original.status}</Badge>
        ),
        size: 110,
      },
    ],
    [w.logDate, w.logDirection, w.logType, w.logRecipient, w.logStatus, w.outbound, w.inbound],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    enableSortingRemoval: false,
    state: { sorting, columnFilters },
  });

  const search = (table.getColumn('messageType')?.getFilterValue() ?? '') as string;

  return (
    <div className="space-y-3.5">
      <div className="relative max-w-xs">
        <Input
          id={`${id}-search`}
          ref={inputRef}
          className={cn(
            'peer h-9 border-[var(--border)]/80 bg-[var(--surface-secondary)]/40 ps-9 text-[13px]',
            'hover:bg-[var(--surface-secondary)]/65 focus-visible:bg-[var(--surface)]',
            Boolean(search) && 'pe-9',
          )}
          value={search}
          onChange={(e) => table.getColumn('messageType')?.setFilterValue(e.target.value)}
          placeholder={w.tableFilterLogs}
          type="text"
          aria-label={w.tableFilterLogs}
        />
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-[var(--muted-foreground)]">
          <ListFilter size={15} strokeWidth={2} aria-hidden />
        </div>
        {Boolean(search) ? (
          <button
            type="button"
            className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-xl text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            aria-label={w.tableClearFilter}
            onClick={() => {
              table.getColumn('messageType')?.setFilterValue('');
              inputRef.current?.focus();
            }}
          >
            <CircleX size={15} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl bg-[var(--surface)]">
        <Table className="min-w-[40rem] table-fixed">
          <TableHeader className="[&_tr]:border-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-0 bg-[var(--surface-secondary)]/35 hover:bg-[var(--surface-secondary)]/35"
              >
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          className={cn(
                            '-mx-1.5 inline-flex h-8 max-w-full items-center gap-1 rounded-lg px-1.5 text-start',
                            'transition-colors hover:bg-[var(--surface)]/80 hover:text-[var(--foreground)]',
                            sorted && 'text-[var(--foreground)]',
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="truncate">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {sorted === 'asc' ? (
                            <ChevronUp
                              className="size-3.5 shrink-0 opacity-70"
                              strokeWidth={2}
                              aria-hidden
                            />
                          ) : sorted === 'desc' ? (
                            <ChevronDown
                              className="size-3.5 shrink-0 opacity-70"
                              strokeWidth={2}
                              aria-hidden
                            />
                          ) : null}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-0">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-start">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-[var(--muted-foreground)]"
                >
                  {w.tableNoResults}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 border-[var(--border)]/80 hover:bg-[var(--surface-secondary)]"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label={w.tablePrevPage}
          >
            <ChevronLeft size={15} strokeWidth={2} aria-hidden />
          </Button>
          <span className="px-2 text-[12px] tabular-nums text-[var(--muted-foreground)]">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 border-[var(--border)]/80 hover:bg-[var(--surface-secondary)]"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label={w.tableNextPage}
          >
            <ChevronRight size={15} strokeWidth={2} aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
