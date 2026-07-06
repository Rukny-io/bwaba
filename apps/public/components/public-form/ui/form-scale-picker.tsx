'use client';

import { ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { cn } from '@/lib/utils';

export interface FormScalePickerProps {
  min: number;
  max: number;
  value: unknown;
  onChange: (value: number) => void;
  minLabel?: string | null;
  midLabel?: string | null;
  maxLabel?: string | null;
  className?: string;
}

export function FormScalePicker({
  min,
  max,
  value,
  onChange,
  minLabel,
  midLabel,
  maxLabel,
  className,
}: FormScalePickerProps) {
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const selectedKey =
    value === null || value === undefined || value === ''
      ? null
      : String(value);

  return (
    <div className={cn('space-y-3', className)}>
      <ToggleButtonGroup
        selectionMode="single"
        selectedKeys={selectedKey ? new Set([selectedKey]) : new Set()}
        onSelectionChange={(keys) => {
          const key = [...keys][0];
          if (key != null) onChange(Number(key));
        }}
        className="form-heroui-scale flex flex-wrap gap-2"
        size="sm"
      >
        {nums.map((n) => (
          <ToggleButton key={n} id={String(n)} className="min-w-10">
            {n}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {(minLabel || midLabel || maxLabel) && (
        <div className="grid grid-cols-3 gap-2 text-xs text-[color:var(--form-text-body)]">
          <span className="text-start">{minLabel}</span>
          <span className="text-center">{midLabel}</span>
          <span className="text-end">{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
