'use client';

import { Input, Label, TextField } from '@heroui/react';
import type { DraftFormField } from '@/lib/form-field-utils';
import { setImageFieldRules } from '@/lib/form-field-special';

export function FieldImageSettings({
  field,
  onChange,
}: {
  field: DraftFormField;
  onChange: (field: DraftFormField) => void;
}) {
  const rules = setImageFieldRules(field.validationRules, {});

  return (
    <div className="mt-6 space-y-4">
      <TextField>
        <Label>رابط الصورة</Label>
        <Input
          value={rules.imageUrl ?? ''}
          onChange={(e) =>
            onChange({
              ...field,
              validationRules: setImageFieldRules(field.validationRules, {
                imageUrl: e.target.value,
              }),
            })
          }
          placeholder="https://example.com/image.jpg"
          dir="ltr"
        />
      </TextField>
      <TextField>
        <Label>نص بديل (alt)</Label>
        <Input
          value={rules.alt ?? ''}
          onChange={(e) =>
            onChange({
              ...field,
              validationRules: setImageFieldRules(field.validationRules, {
                alt: e.target.value,
              }),
            })
          }
          placeholder="وصف مختصر للصورة"
        />
      </TextField>
    </div>
  );
}
