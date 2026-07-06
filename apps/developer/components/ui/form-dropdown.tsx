'use client';

import { ChevronDown } from 'lucide-react';
import { Dropdown, Label } from '@heroui/react';
import { cn } from '@/lib/utils';

export interface FormDropdownOption {
  id: string;
  label: string;
}

interface FormDropdownProps {
  label: string;
  value: string;
  options: FormDropdownOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  dir?: 'ltr' | 'rtl';
}

export function FormDropdown({
  label,
  value,
  options,
  placeholder,
  onChange,
  className,
  dir,
}: FormDropdownProps) {
  const selectedLabel = options.find((option) => option.id === value)?.label;

  return (
    <div className={cn('w-full', className)}>
      <p className="mb-1.5 text-xs font-medium text-[var(--foreground)]">{label}</p>
      <Dropdown>
        <Dropdown.Trigger
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none transition-shadow',
            'data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-[var(--primary)]',
          )}
        >
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-start',
              selectedLabel ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]',
            )}
            dir={dir}
          >
            {selectedLabel ?? placeholder}
          </span>
          <ChevronDown className="size-4 shrink-0 text-[var(--muted-foreground)]" />
        </Dropdown.Trigger>

        <Dropdown.Popover placement="bottom start" className="w-[var(--trigger-width)]">
          <Dropdown.Menu
            selectionMode="single"
            selectedKeys={new Set(value ? [value] : [])}
            onSelectionChange={(keys) => {
              if (keys === 'all') return;
              const next = [...keys][0];
              if (next != null) onChange(String(next));
            }}
          >
            {options.map((option) => (
              <Dropdown.Item key={option.id} id={option.id} textValue={option.label}>
                <Dropdown.ItemIndicator />
                <Label>{option.label}</Label>
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
