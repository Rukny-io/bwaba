'use client';

import { CheckSquare, Circle, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label, TextField } from '@heroui/react';
import type { DraftFormField } from '@/lib/form-field-utils';

interface FieldOptionsEditorProps {
  field: DraftFormField;
  onChange: (field: DraftFormField) => void;
  variant?: 'radio' | 'checkbox';
}

export function FieldOptionsEditor({
  field,
  onChange,
  variant = 'radio',
}: FieldOptionsEditorProps) {
  const Icon = variant === 'checkbox' ? CheckSquare : Circle;

  return (
    <div className="space-y-2">
      {field.options.map((option, i) => (
        <div key={i} className="group flex items-center gap-2">
          <Icon className="size-4 shrink-0 text-[var(--muted-foreground)]" />
          <TextField
            className="flex-1"
            value={option}
            onChange={(val) => {
              const newOptions = [...field.options];
              newOptions[i] = val;
              onChange({ ...field, options: newOptions });
            }}
            aria-label={`خيار ${i + 1}`}
            fullWidth
          >
            <Input placeholder={`خيار ${i + 1}`} className="h-9" />
          </TextField>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-w-8 size-8 shrink-0 rounded-full px-0 text-[var(--muted-foreground)] opacity-0 transition-opacity hover:border-[var(--danger)] hover:text-[var(--danger)] focus-visible:opacity-100 group-hover:opacity-100"
            onPress={() => {
              const newOptions = field.options.filter((_, idx) => idx !== i);
              onChange({ ...field, options: newOptions });
            }}
            aria-label="حذف الخيار"
            isDisabled={field.options.length <= 1}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1 ps-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-full px-3 text-xs font-medium text-[var(--foreground)]"
          onPress={() => {
            onChange({
              ...field,
              options: [...field.options, `خيار ${field.options.length + 1}`],
            });
          }}
        >
          <Plus className="size-3.5" />
          إضافة خيار
        </Button>
      </div>
    </div>
  );
}
