'use client';

import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { FormChoiceOption } from './form-choice-list';

export interface FormRankingListProps {
  fieldLabel: string;
  options: FormChoiceOption[];
  value: unknown;
  onChange: (value: string[]) => void;
  className?: string;
}

export function FormRankingList({
  fieldLabel,
  options,
  value,
  onChange,
  className,
}: FormRankingListProps) {
  const defaultOrder = useMemo(
    () => options.map((o) => o.label),
    [options],
  );

  const items = useMemo(() => {
    const current = Array.isArray(value) ? (value as string[]) : [];
    if (
      current.length === defaultOrder.length &&
      defaultOrder.every((label) => current.includes(label))
    ) {
      return current;
    }
    return defaultOrder;
  }, [value, defaultOrder]);

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current || defaultOrder.length === 0) return;
    const current = Array.isArray(value) ? (value as string[]) : [];
    if (current.length === 0) {
      initialized.current = true;
      onChange(defaultOrder);
    }
  }, [defaultOrder, onChange, value]);

  function move(index: number, direction: -1 | 1) {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <ol
      className={cn('pf-ranking-list', className)}
      aria-label={fieldLabel}
    >
      {items.map((label, index) => (
        <li key={`${label}-${index}`} className="pf-ranking-item">
          <span className="pf-ranking-item__rank" aria-hidden>
            {index + 1}
          </span>
          <span className="min-w-0 flex-1 text-sm font-medium text-[color:var(--form-text-heading)]">
            {label}
          </span>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              className="pf-ranking-btn"
              aria-label={`رفع «${label}»`}
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 12V4M4 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className="pf-ranking-btn"
              aria-label={`خفض «${label}»`}
              disabled={index === items.length - 1}
              onClick={() => move(index, 1)}
            >
              <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 4v8M4 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
