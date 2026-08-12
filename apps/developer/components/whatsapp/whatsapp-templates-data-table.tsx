'use client';

import { useId, useMemo, useRef, useState } from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleX,
  Filter,
  ListFilter,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslations } from '@/components/providers/translations-provider';
import type { WhatsappTemplate } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const nameFilterFn: FilterFn<WhatsappTemplate> = (row, _columnId, filterValue) => {
  const q = String(filterValue ?? '')
    .toLowerCase()
    .trim();
  if (!q) return true;
  const t = row.original;
  return `${t.name} ${t.language} ${t.category}`.toLowerCase().includes(q);
};

const statusFilterFn: FilterFn<WhatsappTemplate> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true;
  return filterValue.includes(String(row.getValue(columnId)).toUpperCase());
};

function statusBadgeVariant(status: string) {
  const s = status.toUpperCase();
  if (s === 'APPROVED') return 'success' as const;
  if (s === 'PENDING') return 'warning' as const;
  if (s === 'REJECTED') return 'destructive' as const;
  return 'secondary' as const;
}

export function WhatsappTemplatesDataTable({ data }: { data: WhatsappTemplate[] }) {
  const id = useId();
  const w = useTranslations().whatsapp;
  const inputRef = useRef<HTMLInputElement>(null);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);

  const statusLabel = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'APPROVED') return w.templateStatusApproved;
    if (s === 'PENDING') return w.templateStatusPending;
    if (s === 'REJECTED') return w.templateStatusRejected;
    return status;
  };

  const columns = useMemo<ColumnDef<WhatsappTemplate>[]>(
    () => [
      {
        header: w.templateName,
        accessorKey: 'name',
        cell: ({ row }) => (
          <span className="font-mono text-[13px] font-medium" dir="ltr">
            {row.getValue('name')}
          </span>
        ),
        filterFn: nameFilterFn,
      },
      {
        header: w.templateLanguage,
        accessorKey: 'language',
        cell: ({ row }) => (
          <span dir="ltr" className="text-[13px]">
            {row.getValue('language')}
          </span>
        ),
      },
      {
        header: w.templateCategory,
        accessorKey: 'category',
        cell: ({ row }) => (
          <span
            dir="ltr"
            className="text-[13px] uppercase tracking-wide text-[var(--muted-foreground)]"
          >
            {row.getValue('category')}
          </span>
        ),
      },
      {
        header: w.templateStatus,
        accessorKey: 'status',
        cell: ({ row }) => {
          const status = String(row.getValue('status'));
          return (
            <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>
          );
        },
        filterFn: statusFilterFn,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labels from dictionary
    [w.templateName, w.templateLanguage, w.templateCategory, w.templateStatus],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: { sorting, pagination, columnFilters },
  });

  const uniqueStatusValues = useMemo(() => {
    const statusColumn = table.getColumn('status');
    if (!statusColumn) return [];
    return Array.from(statusColumn.getFacetedUniqueValues().keys())
      .map(String)
      .sort();
  }, [table.getColumn('status')?.getFacetedUniqueValues()]);

  const statusCounts = useMemo(() => {
    const statusColumn = table.getColumn('status');
    if (!statusColumn) return new Map<string, number>();
    return statusColumn.getFacetedUniqueValues();
  }, [table.getColumn('status')?.getFacetedUniqueValues()]);

  const selectedStatuses = useMemo(() => {
    return (table.getColumn('status')?.getFilterValue() as string[] | undefined) ?? [];
  }, [table.getColumn('status')?.getFilterValue()]);

  function handleStatusChange(checked: boolean, value: string) {
    const next = selectedStatuses.slice();
    if (checked) next.push(value);
    else {
      const i = next.indexOf(value);
      if (i > -1) next.splice(i, 1);
    }
    table.getColumn('status')?.setFilterValue(next.length ? next : undefined);
  }

  const nameFilter = (table.getColumn('name')?.getFilterValue() ?? '') as string;

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[14rem] flex-1 sm:max-w-xs">
          <Input
            id={`${id}-search`}
            ref={inputRef}
            className={cn(
              'peer h-9 border-[var(--border)]/80 bg-[var(--surface-secondary)]/40 ps-9 text-[13px]',
              'hover:bg-[var(--surface-secondary)]/65',
              'focus-visible:bg-[var(--surface)]',
              Boolean(nameFilter) && 'pe-9',
            )}
            value={nameFilter}
            onChange={(e) => table.getColumn('name')?.setFilterValue(e.target.value)}
            placeholder={w.tableFilterTemplates}
            type="text"
            aria-label={w.tableFilterTemplates}
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-[var(--muted-foreground)]">
            <ListFilter size={15} strokeWidth={2} aria-hidden />
          </div>
          {Boolean(nameFilter) ? (
            <button
              type="button"
              className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-xl text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              aria-label={w.tableClearFilter}
              onClick={() => {
                table.getColumn('name')?.setFilterValue('');
                inputRef.current?.focus();
              }}
            >
              <CircleX size={15} strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              type="button"
              size="sm"
              className="h-9 border-[var(--border)]/80 bg-[var(--surface-secondary)]/40 text-[13px] hover:bg-[var(--surface-secondary)]"
            >
              <Filter className="opacity-60" size={15} strokeWidth={2} aria-hidden />
              {w.templateStatus}
              {selectedStatuses.length > 0 ? (
                <span className="ms-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-[var(--surface)] px-1.5 text-[10px] font-semibold tabular-nums text-[var(--muted-foreground)]">
                  {selectedStatuses.length}
                </span>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-44 p-3" align="start">
            <div className="space-y-3">
              <div className="text-xs font-medium text-[var(--muted-foreground)]">
                {w.tableFilters}
              </div>
              <div className="space-y-2.5">
                {uniqueStatusValues.map((value, i) => (
                  <div
                    key={value}
                    className="flex items-center gap-2 rounded-lg px-1 py-0.5 transition-colors hover:bg-[var(--surface-secondary)]/70"
                  >
                    <Checkbox
                      id={`${id}-status-${i}`}
                      checked={selectedStatuses.includes(value)}
                      onCheckedChange={(checked) =>
                        handleStatusChange(checked === true, value)
                      }
                    />
                    <Label
                      htmlFor={`${id}-status-${i}`}
                      className="flex grow cursor-pointer justify-between gap-2 font-normal"
                    >
                      {statusLabel(value)}
                      <span className="ms-2 text-xs tabular-nums text-[var(--muted-foreground)]">
                        {statusCounts.get(value)}
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="overflow-hidden rounded-2xl bg-[var(--surface)]">
        <Table className="min-w-[36rem] table-fixed">
          <TableHeader className="[&_tr]:border-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-0 bg-[var(--surface-secondary)]/35 hover:bg-[var(--surface-secondary)]/35"
              >
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead key={header.id} className="w-1/4">
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

      <div className="flex flex-wrap items-center justify-between gap-3 px-0.5">
        <div className="flex items-center gap-2.5">
          <Label
            htmlFor={`${id}-rows`}
            className="text-[12px] text-[var(--muted-foreground)] max-sm:sr-only"
          >
            {w.tableRowsPerPage}
          </Label>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger
              id={`${id}-rows`}
              className="h-9 w-fit border-[var(--border)]/80 bg-[var(--surface-secondary)]/40 whitespace-nowrap text-[13px] hover:bg-[var(--surface-secondary)]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-[12px] text-[var(--muted-foreground)]" aria-live="polite">
          <span className="tabular-nums text-[var(--foreground)]">
            {table.getRowCount() === 0
              ? 0
              : table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                1}
            -
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getRowCount(),
            )}
          </span>{' '}
          {w.tableOf}{' '}
          <span className="tabular-nums text-[var(--foreground)]">{table.getRowCount()}</span>
        </p>

        <Pagination className="mx-0 w-auto">
          <PaginationContent className="gap-1">
            {(
              [
                {
                  label: w.tableFirstPage,
                  onClick: () => table.firstPage(),
                  disabled: !table.getCanPreviousPage(),
                  icon: ChevronFirst,
                },
                {
                  label: w.tablePrevPage,
                  onClick: () => table.previousPage(),
                  disabled: !table.getCanPreviousPage(),
                  icon: ChevronLeft,
                },
                {
                  label: w.tableNextPage,
                  onClick: () => table.nextPage(),
                  disabled: !table.getCanNextPage(),
                  icon: ChevronRight,
                },
                {
                  label: w.tableLastPage,
                  onClick: () => table.lastPage(),
                  disabled: !table.getCanNextPage(),
                  icon: ChevronLast,
                },
              ] as const
            ).map((item) => (
              <PaginationItem key={item.label}>
                <Button
                  size="icon"
                  variant="outline"
                  type="button"
                  className="size-8 border-[var(--border)]/80 bg-[var(--surface)] hover:bg-[var(--surface-secondary)] disabled:pointer-events-none disabled:opacity-40"
                  onClick={item.onClick}
                  disabled={item.disabled}
                  aria-label={item.label}
                >
                  <item.icon size={15} strokeWidth={2} aria-hidden />
                </Button>
              </PaginationItem>
            ))}
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
