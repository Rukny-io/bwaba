'use client';

import {
  Description,
  FieldError,
  Input,
  Label,
  TextField,
} from '@heroui/react';
import { cn } from '@/lib/utils';

export interface FormTextFieldProps {
  id: string;
  label: React.ReactNode;
  description?: string | null;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  disabled?: boolean;
  min?: number;
  max?: number;
  dir?: 'ltr' | 'rtl' | 'auto';
  className?: string;
}

export function FormTextField({
  id,
  label,
  description,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  error,
  disabled,
  min,
  max,
  dir,
  className,
}: FormTextFieldProps) {
  return (
    <TextField
      id={id}
      name={id}
      value={value}
      onChange={(next) => onChange(next)}
      isRequired={required}
      isInvalid={Boolean(error)}
      isDisabled={disabled}
      fullWidth
      className={cn('form-heroui-field', className)}
    >
      <Label>{label}</Label>
      {description?.trim() ? (
        <Description>{description.trim()}</Description>
      ) : null}
      <Input
        type={type}
        placeholder={placeholder}
        min={min}
        max={max}
        dir={dir}
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </TextField>
  );
}
