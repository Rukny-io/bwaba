'use client';

import type { ReactNode } from 'react';
import { Description, FieldError, Switch } from '@heroui/react';
import { cn } from '@/lib/utils';

export interface FormSwitchFieldProps {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  error?: string | null;
  className?: string;
}

export function FormSwitchField({
  id,
  label,
  description,
  checked,
  onChange,
  required,
  error,
  className,
}: FormSwitchFieldProps) {
  return (
    <div
      className={cn(
        'form-heroui-field form-heroui-switch flex items-start justify-between gap-4',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[color:var(--form-text-heading)]">
          {label}
        </p>
        {description ? (
          <Description className="mt-1">{description}</Description>
        ) : null}
        {error ? <FieldError className="mt-1">{error}</FieldError> : null}
      </div>
      <Switch
        id={id}
        name={id}
        isSelected={checked}
        onChange={onChange}
        isRequired={required}
        isInvalid={Boolean(error)}
        aria-label={typeof label === 'string' ? label : undefined}
      >
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch>
    </div>
  );
}
