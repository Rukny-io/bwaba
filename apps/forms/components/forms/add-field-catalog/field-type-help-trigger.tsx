'use client';

import type { SyntheticEvent } from 'react';
import { Popover, Tooltip } from '@heroui/react';
import { CircleHelp } from 'lucide-react';
import type { FieldCatalogItem } from '@/lib/form-field-catalog';
import { cn } from '@/lib/utils';

function stopRowActivation(event: SyntheticEvent) {
  event.stopPropagation();
}

function FieldTypeHelpContent({ item }: { item: FieldCatalogItem }) {
  return (
    <div className="space-y-2 text-right" dir="rtl">
      <p className="text-[12px] leading-relaxed text-[var(--foreground)]">{item.helpText}</p>
      <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">
        <span className="font-semibold text-[var(--foreground)]">متى تستخدمه: </span>
        {item.helpWhen}
      </p>
      <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">
        <span className="font-semibold text-[var(--foreground)]">مثال: </span>
        {item.helpExample}
      </p>
    </div>
  );
}

const helpIconClassName = cn(
  'inline-flex shrink-0 items-center justify-center rounded-full p-0.5',
  'text-[var(--muted-foreground)]/70 transition-colors duration-150',
  'hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-brand)]/30',
);

interface FieldTypeHelpTriggerProps {
  item: FieldCatalogItem;
}

export function FieldTypeHelpTrigger({ item }: FieldTypeHelpTriggerProps) {
  const ariaLabel = `شرح نوع الحقل: ${item.label}`;

  return (
    <>
      <span
        className="hidden md:inline-flex"
        onClick={stopRowActivation}
        onPointerDown={stopRowActivation}
      >
        <Tooltip delay={200}>
          <Tooltip.Trigger aria-label={ariaLabel} className={helpIconClassName}>
            <CircleHelp className="size-3.5" aria-hidden />
          </Tooltip.Trigger>
          <Tooltip.Content
            placement="top"
            showArrow
            className="max-w-[280px] px-3 py-2.5"
            offset={8}
          >
            <Tooltip.Arrow />
            <FieldTypeHelpContent item={item} />
          </Tooltip.Content>
        </Tooltip>
      </span>

      <span
        className="inline-flex md:hidden"
        onClick={stopRowActivation}
        onPointerDown={stopRowActivation}
      >
        <Popover>
          <Popover.Trigger aria-label={ariaLabel} className={helpIconClassName}>
            <CircleHelp className="size-3.5" aria-hidden />
          </Popover.Trigger>
          <Popover.Content placement="top" className="max-w-[min(280px,calc(100vw-2rem))]">
            <Popover.Dialog className="px-3 py-2.5">
              <Popover.Arrow />
              <FieldTypeHelpContent item={item} />
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </span>
    </>
  );
}
