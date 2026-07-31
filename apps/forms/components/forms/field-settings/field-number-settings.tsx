'use client';

import { Hash } from 'lucide-react';
import { Input, Label, TextField } from '@heroui/react';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { parseOptionalNumberInput, type DraftFormField } from '@/lib/form-field-utils';

interface FieldNumberSettingsProps {
  field: DraftFormField;
  onChange: (field: DraftFormField) => void;
}

export function FieldNumberSettings({
  field,
  onChange,
}: FieldNumberSettingsProps) {
  return (
    <div className="mt-6">
      <SettingsSectionCard
        icon={Hash}
        title="رقم"
        description="سؤال بإجابة رقمية. يمكنك تحديد حد أدنى و/أو حد أقصى للقيمة المقبولة."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            className="w-full"
            value={field.minValue != null ? String(field.minValue) : ''}
            onChange={(value) =>
              onChange({
                ...field,
                minValue: parseOptionalNumberInput(value),
              })
            }
            aria-label="الحد الأدنى للرقم"
            fullWidth
          >
            <Label>الحد الأدنى (اختياري)</Label>
            <Input type="number" inputMode="decimal" placeholder="بدون حد" />
          </TextField>
          <TextField
            className="w-full"
            value={field.maxValue != null ? String(field.maxValue) : ''}
            onChange={(value) =>
              onChange({
                ...field,
                maxValue: parseOptionalNumberInput(value),
              })
            }
            aria-label="الحد الأقصى للرقم"
            fullWidth
          >
            <Label>الحد الأقصى (اختياري)</Label>
            <Input type="number" inputMode="decimal" placeholder="بدون حد" />
          </TextField>
        </div>
        {field.minValue != null || field.maxValue != null ? (
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            {field.minValue != null && field.maxValue != null
              ? `يُقبل فقط أرقام بين ${field.minValue} و ${field.maxValue}.`
              : field.minValue != null
                ? `يجب أن يكون الرقم ${field.minValue} أو أكبر.`
                : `يجب أن يكون الرقم ${field.maxValue} أو أقل.`}
          </p>
        ) : null}
      </SettingsSectionCard>
    </div>
  );
}
