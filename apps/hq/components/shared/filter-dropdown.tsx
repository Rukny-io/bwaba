'use client';

import type { Key, Selection } from '@react-types/shared';
import { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, Dropdown, Label } from '@heroui/react';
import { cn } from '@/lib/utils';

const ALL_KEY = '__all__';

function toFilterKey(value: string): string {
  return value || ALL_KEY;
}

function fromFilterKey(key: Key): string {
  const id = String(key);
  return id === ALL_KEY ? '' : id;
}

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  disabled,
  className,
  size = 'md',
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const selectedKey = toFilterKey(value);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? options[0]?.label;

  const selectedKeys = useMemo(
    () => new Set<Key>([selectedKey]),
    [selectedKey],
  );

  function handleSelectionChange(keys: Selection) {
    if (keys === 'all') return;
    const next = [...keys][0];
    if (next == null) return;
    onChange(fromFilterKey(next));
  }

  const compact = size === 'sm';

  return (
    <Dropdown>
      <Button
        variant="outline"
        aria-label={label}
        isDisabled={disabled}
        className={cn(
          compact
            ? 'h-8 min-w-[7rem] justify-between gap-1.5 rounded-lg border-0 bg-[var(--surface-secondary)] px-2.5 text-start'
            : 'h-10 min-w-[10rem] justify-between gap-2 rounded-xl border-[var(--border)] bg-[var(--field-background)] px-3 text-start',
          value && !compact && 'border-[var(--primary)]/40',
          value && compact && 'bg-[color-mix(in_srgb,var(--foreground)_8%,var(--surface-secondary))]',
          className,
        )}
      >
        <span
          className={cn(
            'min-w-0 truncate font-medium text-[var(--foreground)]',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {selectedLabel}
        </span>
        <ChevronDown
          className={cn(
            'shrink-0 text-[var(--muted-foreground)]',
            compact ? 'size-3.5' : 'size-4',
          )}
        />
      </Button>
      <Dropdown.Popover placement="bottom start" className="min-w-[12rem]">
        <Dropdown.Menu
          selectedKeys={selectedKeys}
          selectionMode="single"
          onSelectionChange={handleSelectionChange}
        >
          <Dropdown.Section>
            {options.map((option) => (
              <Dropdown.Item
                key={option.value || ALL_KEY}
                id={option.value || ALL_KEY}
                textValue={option.label}
              >
                <Dropdown.ItemIndicator />
                <Label>{option.label}</Label>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
