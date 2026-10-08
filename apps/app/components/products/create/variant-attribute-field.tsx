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
import {
  getTemplateOptionLabel,
  getVariantAttributeLabel,
} from '@/lib/products/template-locale';
import { useTranslations } from '@/lib/i18n';

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
  const { t } = useTranslations();

  return (
    <div
      className="variant-attribute-mode flex rounded-xl bg-default p-0.5"
      role="tablist"
      aria-label={t('products.create.pickModeAria', { label })}
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'list'}
        onClick={() => onChange('list')}
        className={cn(
          'flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors duration-150',
          mode === 'list'
            ? 'bg-surface text-foreground'
            : 'text-muted hover:text-foreground',
        )}
      >
        {t('products.create.listMode')}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'custom'}
        onClick={() => onChange('custom')}
        className={cn(
          'flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors duration-150',
          mode === 'custom'
            ? 'bg-surface text-foreground'
            : 'text-muted hover:text-foreground',
        )}
      >
        {t('products.create.customMode')}
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
  const { t, locale } = useTranslations();
  const attributeLabel = getVariantAttributeLabel(attribute, locale);
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
      <Label className="text-xs font-medium text-muted">{attributeLabel}</Label>

      <VariantAttributeModeSwitch
        mode={mode}
        onChange={switchMode}
        label={attributeLabel}
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
          placeholder={t('products.create.selectPlaceholder')}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {attribute.options.map((option) => {
                const optionLabel = getTemplateOptionLabel(option, locale);
                return (
                  <ListBox.Item key={option} id={option} textValue={optionLabel}>
                    {optionLabel}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                );
              })}
              <ListBox.Item
                id={CUSTOM_SELECT_OPTION}
                textValue={t('products.create.customValue')}
                className="text-accent"
              >
                {t('products.create.customUnavailable')}
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
            placeholder={t('products.create.enterAttribute', {
              label: attributeLabel,
            })}
            className="text-sm"
          />
        </TextField>
      )}
    </div>
  );
}
