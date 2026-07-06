'use client';

import type { Key, ReactNode } from 'react';
import { Button, ListBox, Select, Spinner } from '@heroui/react';
import { ChevronLeft, ChevronRight, Printer, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PagerOption {
  id: string;
  label: string;
}

interface SubmissionPagerToolbarProps {
  selectLabel: string;
  options: PagerOption[];
  selectedKey: string;
  onSelectionChange: (key: string) => void;
  page: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
  previousAriaLabel?: string;
  nextAriaLabel?: string;
  actions?: ReactNode;
  /** عرض القائمة — افتراضي مضغوط لـ «استجابة N» */
  selectClassName?: string;
  className?: string;
}

export function SubmissionPagerToolbar({
  selectLabel,
  options,
  selectedKey,
  onSelectionChange,
  page,
  total,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
  previousAriaLabel = 'السابق',
  nextAriaLabel = 'التالي',
  actions,
  selectClassName,
  className,
}: SubmissionPagerToolbarProps) {
  function handleSelection(key: Key | null) {
    if (key == null) return;
    onSelectionChange(String(key));
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--border)]/80 bg-[var(--surface)] p-4 print:hidden',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="shrink-0 text-xs font-medium text-[var(--muted-foreground)]">
          {selectLabel}
        </span>

        <Select
          className={cn(
            'submission-pager-select w-[9.5rem] shrink-0 sm:w-[10rem]',
            selectClassName,
          )}
          selectedKey={selectedKey}
          onSelectionChange={handleSelection}
          aria-label={selectLabel}
        >
          <Select.Trigger
            dir="rtl"
            className="h-10 rounded-xl border-[var(--border)] bg-[var(--surface-secondary)]/60 text-end"
          >
            <Select.Value className="w-full truncate text-end text-sm" />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover
            dir="rtl"
            placement="bottom"
            className="submission-pager-select__popover z-50 max-h-72"
          >
            <ListBox dir="rtl" className="max-h-64 overflow-y-auto text-end">
              {options.map((opt) => (
                <ListBox.Item
                  key={opt.id}
                  id={opt.id}
                  textValue={opt.label}
                  className="justify-end text-end text-sm"
                >
                  {opt.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <div
          className="hidden h-6 w-px shrink-0 bg-[var(--border)] sm:block"
          aria-hidden
        />

        <div
          className="flex items-center gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/50 p-0.5"
          role="group"
          aria-label="التنقل"
        >
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            isDisabled={!canPrevious}
            onPress={onPrevious}
            isIconOnly
            className="size-9 shrink-0 rounded-lg"
            aria-label={previousAriaLabel}
          >
            <ChevronRight className="size-4" />
          </Button>
          <span className="min-w-[4.25rem] px-2 text-center text-xs font-medium tabular-nums text-[var(--muted-foreground)]">
            {page} من {total}
          </span>
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            isDisabled={!canNext}
            onPress={onNext}
            isIconOnly
            className="size-9 shrink-0 rounded-lg"
            aria-label={nextAriaLabel}
          >
            <ChevronLeft className="size-4" />
          </Button>
        </div>

        {actions ? (
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

export function PagerIconActions({
  onPrint,
  onDelete,
  deleteBusy,
  printAriaLabel = 'طباعة',
  deleteAriaLabel = 'حذف',
}: {
  onPrint?: () => void;
  onDelete?: () => void;
  deleteBusy?: boolean;
  printAriaLabel?: string;
  deleteAriaLabel?: string;
}) {
  return (
    <>
      {onPrint ? (
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          onPress={onPrint}
          isIconOnly
          className="size-9 rounded-lg"
          aria-label={printAriaLabel}
        >
          <Printer className="size-4" data-slot="icon" />
        </Button>
      ) : null}
      {onDelete ? (
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          onPress={onDelete}
          isDisabled={deleteBusy}
          isIconOnly
          className="size-9 rounded-lg text-[var(--danger)] hover:bg-[var(--danger)]/10"
          aria-label={deleteAriaLabel}
        >
          {deleteBusy ? (
            <Spinner size="sm" />
          ) : (
            <Trash2 className="size-4" data-slot="icon" />
          )}
        </Button>
      ) : null}
    </>
  );
}
