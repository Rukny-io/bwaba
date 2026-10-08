import { cn } from '@/lib/utils';

export const ORDERS_TABLE_CHECKBOX_COL = '52px';

const rowHoverTd =
  'hover:[&_td]:bg-[color-mix(in_oklab,var(--surface-secondary)_48%,var(--surface))]';
const rowSelectedTd =
  'data-[state=selected]:[&_td]:bg-[color-mix(in_oklab,var(--surface-secondary)_76%,var(--surface))]';

export const ordersTableChrome = {
  shell: 'relative isolate min-w-0 overflow-hidden rounded-2xl bg-transparent',
  scroll:
    'overflow-x-auto w-full overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
  table:
    'w-full min-w-[64rem] table-fixed border-collapse text-[13px] leading-snug',
  headRow: 'bg-[color-mix(in_oklab,var(--surface-secondary)_32%,transparent)]',
  bodyRow: cn(
    'group',
    rowHoverTd,
    rowSelectedTd,
    'hover:bg-transparent dark:hover:bg-transparent',
    'data-[state=selected]:bg-transparent dark:data-[state=selected]:bg-transparent',
    'not-in-data-[variant=card]:hover:!bg-transparent',
    'dark:not-in-data-[variant=card]:hover:!bg-transparent',
    'not-in-data-[variant=card]:data-[state=selected]:!bg-transparent',
    'dark:not-in-data-[variant=card]:data-[state=selected]:!bg-transparent',
  ),
  headCell:
    'h-11 px-3 align-middle text-[11px] font-medium leading-none tracking-tight text-[var(--muted-foreground)]',
  bodyCell:
    'h-[45px] bg-transparent px-3 py-0 align-middle text-[var(--foreground)]',
  stickyCheckboxHead: 'sticky start-0 z-20 bg-[color-mix(in_oklab,var(--surface-secondary)_32%,var(--surface))]',
  stickyCheckboxBody: cn(
    'sticky start-0 z-10 [contain:paint] bg-[var(--surface)]',
    'group-data-[state=selected]:shadow-[inset_3px_0_0_0_var(--accent)]',
  ),
  stickyActionsHead:
    'sticky end-0 z-20 bg-[color-mix(in_oklab,var(--surface-secondary)_32%,var(--surface))] px-3 sm:px-4',
  stickyActionsBody: 'sticky end-0 z-10 [contain:paint] bg-[var(--surface)] px-3 sm:px-4',
  rowDetailsButton:
    'text-[var(--muted-foreground)] hover:bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] hover:text-[var(--foreground)]',
  numeric: 'tabular-nums',
  muted: 'text-[var(--muted-foreground)]',
  noticeBar: 'px-3 py-2',
} as const;

export type OrdersTableColumnId =
  | 'select'
  | 'order'
  | 'customer'
  | 'status'
  | 'payment'
  | 'items'
  | 'total'
  | 'date'
  | 'actions';

export interface OrdersTableColumn {
  id: OrdersTableColumnId;
  label: string;
  align: 'start' | 'center' | 'end';
  widthClass: string;
}

export const ORDERS_TABLE_COLUMNS: OrdersTableColumn[] = [
  { id: 'select', label: '', align: 'center', widthClass: 'w-[var(--table-checkbox-col)]' },
  { id: 'order', label: 'رقم الطلب', align: 'center', widthClass: 'w-[7.25rem]' },
  { id: 'customer', label: 'العميل', align: 'start', widthClass: 'w-[26%] min-w-[10rem]' },
  { id: 'status', label: 'الحالة', align: 'center', widthClass: 'w-[6.75rem]' },
  { id: 'payment', label: 'الدفع', align: 'center', widthClass: 'w-[6.75rem]' },
  { id: 'items', label: 'المنتجات', align: 'center', widthClass: 'w-[5rem]' },
  { id: 'total', label: 'المبلغ', align: 'center', widthClass: 'w-[6.5rem]' },
  { id: 'date', label: 'التاريخ', align: 'center', widthClass: 'w-[7.25rem]' },
  { id: 'actions', label: '', align: 'center', widthClass: 'w-[6.75rem]' },
];

function alignClass(align: OrdersTableColumn['align']) {
  if (align === 'center') return 'text-center';
  if (align === 'end') return 'text-end';
  return 'text-start';
}

export function ordersTableHeadClass(column: OrdersTableColumn) {
  return cn(
    ordersTableChrome.headCell,
    alignClass(column.align),
    column.widthClass,
    column.id === 'select' && ordersTableChrome.stickyCheckboxHead,
    column.id === 'actions' && ordersTableChrome.stickyActionsHead,
    column.id === 'customer' && 'min-w-0',
  );
}

export function ordersTableCellClass(column: OrdersTableColumn) {
  return cn(
    ordersTableChrome.bodyCell,
    alignClass(column.align),
    column.widthClass,
    column.id === 'select' && ordersTableChrome.stickyCheckboxBody,
    column.id === 'actions' && ordersTableChrome.stickyActionsBody,
    column.id === 'customer' && 'min-w-0 max-w-0',
    'group-hover:bg-[color-mix(in_oklab,var(--surface-secondary)_48%,var(--surface))]',
    'group-data-[state=selected]:bg-[color-mix(in_oklab,var(--surface-secondary)_76%,var(--surface))]',
  );
}
