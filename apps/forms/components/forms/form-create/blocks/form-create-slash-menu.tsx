'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FIELD_CATALOG_ITEMS,
  filterCatalogItems,
  type FieldCatalogItem,
} from '@/lib/form-field-catalog';
import type { FormType } from '@/lib/forms-api';
import { getFormTypeLabel } from '@/lib/forms-format';
import type { WizardFieldType } from '@/lib/form-field-types';
import { cn } from '@/lib/utils';

interface FormCreateSlashMenuProps {
  open: boolean;
  query: string;
  formType: FormType;
  onPick: (type: WizardFieldType) => void;
  onClose: () => void;
  onUseTemplate?: () => void;
  className?: string;
}

export function FormCreateSlashMenu({
  open,
  query,
  formType,
  onPick,
  onClose,
  onUseTemplate,
  className,
}: FormCreateSlashMenuProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const items = useMemo(
    () =>
      filterCatalogItems(FIELD_CATALOG_ITEMS, {
        category: query.trim() ? 'all' : 'suggested',
        search: query,
        formType,
      }).slice(0, 8),
    [query, formType],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (items.length ? (i + 1) % items.length : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) =>
          items.length ? (i - 1 + items.length) % items.length : 0,
        );
        return;
      }
      if (e.key === 'Enter' && items[activeIndex]) {
        e.preventDefault();
        onPick(items[activeIndex].type);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, items, activeIndex, onPick, onClose]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'absolute start-0 top-full z-30 mt-1 w-full min-w-[16rem] max-w-md overflow-hidden',
        'rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl',
        className,
      )}
      role="listbox"
      aria-label="إدراج حقل"
    >
      <div className="border-b border-[var(--border)]/60 px-3 py-2">
        <p className="text-[11px] font-medium text-[var(--muted-foreground)]">
          {query.trim() ? 'نتائج البحث' : 'حقول مقترحة'}
        </p>
      </div>
      <div ref={listRef} className="max-h-64 overflow-y-auto p-1.5">
        {items.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
            لا توجد نتائج
          </p>
        ) : (
          items.map((item, index) => (
            <SlashMenuItem
              key={item.type}
              item={item}
              active={index === activeIndex}
              onPick={() => onPick(item.type)}
              onHover={() => setActiveIndex(index)}
            />
          ))
        )}
      </div>
      {!query.trim() && onUseTemplate ? (
        <div className="border-t border-[var(--border)]/60 p-1.5">
          <button
            type="button"
            onClick={() => {
              onUseTemplate();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)]/70 hover:text-[var(--foreground)]"
          >
            <span className="text-base leading-none">✦</span>
            <span>
              استخدام قالب «{getFormTypeLabel(formType)}» كاملاً
            </span>
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}

function SlashMenuItem({
  item,
  active,
  onPick,
  onHover,
}: {
  item: FieldCatalogItem;
  active: boolean;
  onPick: () => void;
  onHover: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-active={active ? 'true' : undefined}
      onMouseEnter={onHover}
      onClick={onPick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors',
        active
          ? 'bg-[var(--surface-secondary)] text-[var(--foreground)]'
          : 'text-[var(--foreground)] hover:bg-[var(--surface-secondary)]/70',
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)]">
        <Icon className="size-4 text-[var(--primary)]" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{item.label}</span>
        <span className="block truncate text-xs text-[var(--muted-foreground)]">
          {item.description}
        </span>
      </span>
    </button>
  );
}
