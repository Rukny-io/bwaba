'use client';

import type { ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import {
  Description,
  FieldError,
  Label,
  ListBox,
  Select,
} from '@heroui/react';
import { cn } from '@/lib/utils';

export type FormSelectOption = { value: string; label: string };

export interface FormSelectProps {
  id: string;
  label: ReactNode;
  description?: string | null;
  value: string;
  onChange: (value: string) => void;
  options: FormSelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  className?: string;
}

export function FormSelect({
  id,
  label,
  description,
  value,
  onChange,
  options,
  placeholder = 'اختر…',
  required,
  error,
  className,
}: FormSelectProps) {
  return (
    <Select
      id={id}
      name={id}
      dir="rtl"
      isRequired={required}
      isInvalid={Boolean(error)}
      selectedKey={value || null}
      onSelectionChange={(key: Key | null) => {
        if (key != null) onChange(String(key));
      }}
      placeholder={placeholder}
      fullWidth
      className={cn('form-heroui-field form-heroui-select', className)}
    >
      <Label>{label}</Label>
      {description?.trim() ? (
        <Description>{description.trim()}</Description>
      ) : null}
      <Select.Trigger className="rounded-xl !text-end">
        <Select.Value className="w-full !text-end" />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover dir="rtl" placement="bottom">
        <ListBox dir="rtl" className="!text-end">
          {options.map((opt) => (
            <ListBox.Item
              key={opt.value}
              id={opt.value}
              textValue={opt.label}
              className="!justify-start !text-end"
            >
              {opt.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
      {error ? <FieldError>{error}</FieldError> : null}
    </Select>
  );
}
