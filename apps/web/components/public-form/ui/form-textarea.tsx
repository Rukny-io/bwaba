'use client';

import {
  Description,
  FieldError,
  Label,
  TextArea,
  TextField,
} from '@heroui/react';
import { cn } from '@/lib/utils';

export interface FormTextAreaProps {
  id: string;
  label: React.ReactNode;
  description?: string | null;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  rows?: number;
  className?: string;
}

export function FormTextArea({
  id,
  label,
  description,
  value,
  onChange,
  placeholder,
  required,
  error,
  rows = 4,
  className,
}: FormTextAreaProps) {
  return (
    <TextField
      id={id}
      name={id}
      value={value}
      onChange={(next) => onChange(next)}
      isRequired={required}
      isInvalid={Boolean(error)}
      fullWidth
      className={cn('form-heroui-field', className)}
    >
      <Label>{label}</Label>
      {description?.trim() ? (
        <Description>{description.trim()}</Description>
      ) : null}
      <TextArea
        placeholder={placeholder}
        rows={rows}
        className="min-h-[100px] resize-y"
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </TextField>
  );
}
