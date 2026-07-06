'use client';

import { SlidersHorizontal } from 'lucide-react';
import { Input, Label, TextField } from '@heroui/react';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import {
  getScaleMidLabel,
  parseOptionalNumberInput,
  setScaleMidLabel,
  type DraftFormField,
} from '@/lib/form-field-utils';

interface FieldLinearScaleSettingsProps {
  field: DraftFormField;
  onChange: (field: DraftFormField) => void;
}

export function FieldLinearScaleSettings({
  field,
  onChange,
}: FieldLinearScaleSettingsProps) {
  const min = field.minValue ?? 1;
  const max = field.maxValue ?? 5;
  const midLabel = getScaleMidLabel(field.validationRules);

  function updateBounds(nextMin: number, nextMax: number) {
    const safeMin = Math.min(nextMin, nextMax - 1);
    const safeMax = Math.max(nextMax, safeMin + 1);
    onChange({
      ...field,
      minValue: safeMin,
      maxValue: safeMax,
    });
  }

  return (
    <div className="mt-6">
      <SettingsSectionCard
        icon={SlidersHorizontal}
        title="مقياس خطي"
        description="سؤال بإجابة رقمية على مقياس. اضبط حجم المقياس وأضف تسميات على اليسار أو الوسط أو اليمين."
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              className="w-full"
              value={String(min)}
              onChange={(value) => {
                const parsed = parseOptionalNumberInput(value);
                if (parsed !== undefined) updateBounds(parsed, max);
              }}
              aria-label="الحد الأدنى للمقياس"
              fullWidth
            >
              <Label>من</Label>
              <Input type="number" inputMode="numeric" />
            </TextField>
            <TextField
              className="w-full"
              value={String(max)}
              onChange={(value) => {
                const parsed = parseOptionalNumberInput(value);
                if (parsed !== undefined) updateBounds(min, parsed);
              }}
              aria-label="الحد الأعلى للمقياس"
              fullWidth
            >
              <Label>إلى</Label>
              <Input type="number" inputMode="numeric" />
            </TextField>
          </div>

          <p className="text-xs text-[var(--muted-foreground)]">
            المقياس الحالي: {min} — {max} ({max - min + 1} نقاط)
          </p>

          <div className="space-y-2">
            <Label className="text-sm font-medium">تسميات المقياس (اختياري)</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField
                className="w-full"
                value={field.minLabel ?? ''}
                onChange={(value) =>
                  onChange({
                    ...field,
                    minLabel: value.trim() || undefined,
                  })
                }
                aria-label="تسمية يسار المقياس"
                maxLength={100}
                fullWidth
              >
                <Label>يسار</Label>
                <Input placeholder="مثال: غير راضٍ" />
              </TextField>
              <TextField
                className="w-full"
                value={midLabel}
                onChange={(value) =>
                  onChange({
                    ...field,
                    validationRules: setScaleMidLabel(field.validationRules, value),
                  })
                }
                aria-label="تسمية وسط المقياس"
                maxLength={100}
                fullWidth
              >
                <Label>وسط</Label>
                <Input placeholder="مثال: محايد" />
              </TextField>
              <TextField
                className="w-full"
                value={field.maxLabel ?? ''}
                onChange={(value) =>
                  onChange({
                    ...field,
                    maxLabel: value.trim() || undefined,
                  })
                }
                aria-label="تسمية يمين المقياس"
                maxLength={100}
                fullWidth
              >
                <Label>يمين</Label>
                <Input placeholder="مثال: راضٍ جداً" />
              </TextField>
            </div>
          </div>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
