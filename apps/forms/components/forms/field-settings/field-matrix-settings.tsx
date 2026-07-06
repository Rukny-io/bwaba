'use client';

import { Grid3x3, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label, TextField } from '@heroui/react';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import {
  DEFAULT_MATRIX_COLUMNS,
  DEFAULT_MATRIX_ROWS,
} from '@rukny/forms-shared/matrix-field-utils';
import type { DraftFormField } from '@/lib/form-field-utils';

interface FieldMatrixSettingsProps {
  field: DraftFormField;
  onChange: (field: DraftFormField) => void;
}

function getMatrixRows(field: DraftFormField): string[] {
  const rules = field.validationRules;
  if (rules && typeof rules === 'object' && Array.isArray((rules as { rows?: unknown }).rows)) {
    const rows = (rules as { rows: string[] }).rows.filter((row) => row.trim());
    if (rows.length > 0) return rows;
  }
  return [...DEFAULT_MATRIX_ROWS];
}

function MatrixListEditor({
  title,
  description,
  items,
  onChange,
  addLabel,
  itemLabel,
}: {
  title: string;
  description: string;
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
  itemLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-sm font-medium">{title}</Label>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
      {items.map((item, index) => (
        <div key={index} className="group flex items-center gap-2">
          <TextField
            className="flex-1"
            value={item}
            onChange={(value) => {
              const next = [...items];
              next[index] = value;
              onChange(next);
            }}
            aria-label={`${itemLabel} ${index + 1}`}
            fullWidth
          >
            <Input placeholder={`${itemLabel} ${index + 1}`} className="h-9" />
          </TextField>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-w-8 size-8 shrink-0 rounded-full px-0 text-[var(--muted-foreground)] opacity-0 transition-opacity hover:border-[var(--danger)] hover:text-[var(--danger)] focus-visible:opacity-100 group-hover:opacity-100"
            onPress={() => onChange(items.filter((_, i) => i !== index))}
            aria-label={`حذف ${itemLabel} ${index + 1}`}
            isDisabled={items.length <= 1}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <div className="pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-full px-3 text-xs font-medium"
          onPress={() => onChange([...items, `${itemLabel} ${items.length + 1}`])}
        >
          <Plus className="size-3.5" />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

export function FieldMatrixSettings({ field, onChange }: FieldMatrixSettingsProps) {
  const rows = getMatrixRows(field);
  const columns =
    field.options.length > 0 ? field.options : [...DEFAULT_MATRIX_COLUMNS];

  function updateRows(nextRows: string[]) {
    onChange({
      ...field,
      validationRules: {
        ...(field.validationRules && typeof field.validationRules === 'object'
          ? (field.validationRules as Record<string, unknown>)
          : {}),
        rows: nextRows,
      },
    });
  }

  return (
    <div className="mt-6">
      <SettingsSectionCard
        icon={Grid3x3}
        title="جدول المصفوفة"
        description="أضف صفوفاً (عناصر للتقييم) وأعمدة (خيارات المقياس). يختار المستجيب قيمة واحدة لكل صف."
      >
        <div className="space-y-6">
          <MatrixListEditor
            title="الصفوف"
            description="كل صف يمثل سؤالاً أو عنصراً يُقيَّم على المقياس."
            items={rows}
            onChange={updateRows}
            addLabel="إضافة صف"
            itemLabel="صف"
          />
          <MatrixListEditor
            title="الأعمدة"
            description="رؤوس الأعمدة — مثل 1–5 أو تسميات الرضا."
            items={columns}
            onChange={(nextColumns) => onChange({ ...field, options: nextColumns })}
            addLabel="إضافة عمود"
            itemLabel="عمود"
          />
        </div>
      </SettingsSectionCard>
    </div>
  );
}
