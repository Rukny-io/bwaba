'use client';

import type { ReactNode } from 'react';
import { Checkbox, Description, FieldError } from '@heroui/react';
import { cn } from '@/lib/utils';

export interface FormCheckboxFieldProps {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  error?: string | null;
  className?: string;
}

export function FormCheckboxField({
  id,
  label,
  description,
  checked,
  onChange,
  required,
  error,
  className,
}: FormCheckboxFieldProps) {
  return (
    <div className={cn('form-heroui-field form-heroui-checkbox', className)}>
      <Checkbox
        id={id}
        name={id}
        isSelected={checked}
        onChange={onChange}
        isRequired={required}
        isInvalid={Boolean(error)}
        className="items-start gap-3"
      >
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <span className="min-w-0 flex-1 text-sm leading-relaxed text-[color:var(--form-text-heading)]">
          {label}
        </span>
      </Checkbox>
      {description ? (
        <Description className="ms-8 mt-1">{description}</Description>
      ) : null}
      {error ? <FieldError className="ms-8">{error}</FieldError> : null}
    </div>
  );
}
