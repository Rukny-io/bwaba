'use client';

import { ListChecks } from 'lucide-react';
import { Label } from '@heroui/react';
import { FieldOptionsEditor } from '@/components/forms/field-settings/field-options-editor';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import type { DraftFormField } from '@/lib/form-field-utils';

interface FieldMultiselectSettingsProps {
  field: DraftFormField;
  onChange: (field: DraftFormField) => void;
}

export function FieldMultiselectSettings({
  field,
  onChange,
}: FieldMultiselectSettingsProps) {
  return (
    <div className="mt-6">
      <SettingsSectionCard
        icon={ListChecks}
        title="اختيار متعدد"
        description="يُمكّن المستجيب من اختيار أكثر من إجابة من قائمة الخيارات."
      >
        <Label className="mb-2 block text-sm font-medium">الخيارات</Label>
        <FieldOptionsEditor field={field} onChange={onChange} variant="checkbox" />
      </SettingsSectionCard>
    </div>
  );
}
