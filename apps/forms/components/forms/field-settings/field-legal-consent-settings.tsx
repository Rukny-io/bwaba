'use client';

import { Input, Label, TextField } from '@heroui/react';
import type { DraftFormField } from '@/lib/form-field-utils';
import { setLegalConsentRules } from '@/lib/form-field-special';

export function FieldLegalConsentSettings({
  field,
  onChange,
}: {
  field: DraftFormField;
  onChange: (field: DraftFormField) => void;
}) {
  const rules = setLegalConsentRules(field.validationRules, {});

  return (
    <div className="mt-6 space-y-4">
      <TextField>
        <Label>نص الموافقة</Label>
        <Input
          value={rules.consentText ?? ''}
          onChange={(e) =>
            onChange({
              ...field,
              validationRules: setLegalConsentRules(field.validationRules, {
                consentText: e.target.value,
              }),
            })
          }
          placeholder="أوافق على معالجة بياناتي وفق سياسة الخصوصية."
        />
      </TextField>
      <TextField>
        <Label>رابط الشروط (اختياري)</Label>
        <Input
          value={rules.linkUrl ?? ''}
          onChange={(e) =>
            onChange({
              ...field,
              validationRules: setLegalConsentRules(field.validationRules, {
                linkUrl: e.target.value,
              }),
            })
          }
          placeholder="https://..."
          dir="ltr"
        />
      </TextField>
      <TextField>
        <Label>نص الرابط</Label>
        <Input
          value={rules.linkLabel ?? ''}
          onChange={(e) =>
            onChange({
              ...field,
              validationRules: setLegalConsentRules(field.validationRules, {
                linkLabel: e.target.value,
              }),
            })
          }
          placeholder="اقرأ الشروط"
        />
      </TextField>
    </div>
  );
}
