'use client';

import { useEffect, useState } from 'react';
import {
  Input,
  Label,
  ListBox,
  Select,
  TextField,
  cn,
} from '@heroui/react';
import type { VariantAttribute } from '@/lib/products/template-types';

const CUSTOM_SELECT_OPTION = '__variant_custom__';

type AttributeInputMode = 'list' | 'custom';

function resolveAttributeMode(
  value: string,
  options: string[],
): AttributeInputMode {
  if (!value.trim()) return 'list';
  return options.includes(value) ? 'list' : 'custom';
}

interface VariantAttributeModeSwitchProps {
  mode: AttributeInputMode;
  onChange: (mode: AttributeInputMode) => void;
  label: string;
}

function VariantAttributeModeSwitch({
  mode,
  onChange,
  label,
}: VariantAttributeModeSwitchProps) {
  return (
    <div
      className="variant-attribute-mode flex rounded-xl bg-default p-0.5"
      role="tablist"
      aria-label={`طريقة اختيار ${label}`}
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'list'}
        onClick={() => onChange('list')}
        className={cn(
          'flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-[color,background-color,box-shadow] duration-150',
          mode === 'list'
            ? 'bg-surface text-foreground shadow-sm'
            : 'text-muted hover:text-foreground',
        )}
      >
        قائمة
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'custom'}
        onClick={() => onChange('custom')}
        className={cn(
          'flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-[color,background-color,box-shadow] duration-150',
          mode === 'custom'
            ? 'bg-surface text-foreground shadow-sm'
            : 'text-muted hover:text-foreground',
        )}
      >
        مخصص
      </button>
    </div>
  );
}

interface VariantAttributeFieldProps {
  attribute: VariantAttribute;
  value: string;
  onChange: (value: string) => void;
}

export function VariantAttributeField({
  attribute,
  value,
  onChange,
}: VariantAttributeFieldProps) {
  const [mode, setMode] = useState<AttributeInputMode>(() =>
    resolveAttributeMode(value, attribute.options),
  );

  useEffect(() => {
    setMode(resolveAttributeMode(value, attribute.options));
  }, [attribute.options, value]);

  function switchMode(next: AttributeInputMode) {
    setMode(next);
    if (next === 'list' && value && !attribute.options.includes(value)) {
      onChange('');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-medium text-muted">{attribute.labelAr}</Label>

      <VariantAttributeModeSwitch
        mode={mode}
        onChange={switchMode}
        label={attribute.labelAr}
      />

      {mode === 'list' ? (
        <Select
          selectedKey={value && attribute.options.includes(value) ? value : null}
          onSelectionChange={(key) => {
            if (!key) {
              onChange('');
              return;
            }
            if (String(key) === CUSTOM_SELECT_OPTION) {
              switchMode('custom');
              onChange('');
              return;
            }
            onChange(String(key));
          }}
          placeholder="اختر…"
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {attribute.options.map((option) => (
                <ListBox.Item key={option} id={option} textValue={option}>
                  {option}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
              <ListBox.Item
                id={CUSTOM_SELECT_OPTION}
                textValue="قيمة مخصصة"
                className="text-accent"
              >
                غير متوفر — أدخل قيمة مخصصة
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      ) : (
        <TextField
          value={value}
          onChange={onChange}
          className="flex flex-col gap-0"
        >
          <Input
            placeholder={`أدخل ${attribute.labelAr}`}
            className="text-sm"
          />
        </TextField>
      )}
    </div>
  );
}
