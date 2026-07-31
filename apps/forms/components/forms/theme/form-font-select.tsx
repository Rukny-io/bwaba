'use client';

import type { Key } from 'react-aria-components';
import { Label, ListBox, Select } from '@heroui/react';
import {
  ARABIC_FONTS,
  getGoogleFontStylesheetUrl,
  resolveFormFontStack,
} from '@/lib/form-theme';
import { FormThemeFontLoader } from '@/components/forms/theme/form-theme-font-loader';
import { cn } from '@/lib/utils';

interface FormFontSelectProps {
  value: string;
  onChange: (fontFamily: string) => void;
  className?: string;
}

/**
 * اختيار خط النموذج — Select عربي RTL (نفس إصلاحات form-field-type-select).
 */
export function FormFontSelect({
  value,
  onChange,
  className,
}: FormFontSelectProps) {
  function handleSelection(key: Key | null) {
    if (key == null) return;
    onChange(String(key));
  }

  return (
    <>
      {ARABIC_FONTS.map((font) => (
        <FormThemeFontLoader
          key={font.value}
          href={getGoogleFontStylesheetUrl(font.value)}
          fontFamily={font.value}
        />
      ))}
      <Select
      dir="rtl"
      className={cn('form-font-select w-full', className)}
      selectedKey={value}
      onSelectionChange={handleSelection}
      aria-label="نوع الخط"
    >
      <Label className="sr-only">نوع الخط</Label>
      <Select.Trigger className="rounded-xl !text-end">
        <Select.Value className="w-full !text-end" />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover
        dir="rtl"
        className="form-font-select__popover"
        placement="bottom"
      >
        <ListBox dir="rtl" className="!text-end">
          {ARABIC_FONTS.map((font) => (
            <ListBox.Item
              key={font.value}
              id={font.value}
              textValue={font.label}
              className="!justify-start !text-end"
              style={{ fontFamily: resolveFormFontStack(font.value) }}
            >
              {font.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
    </>
  );
}
