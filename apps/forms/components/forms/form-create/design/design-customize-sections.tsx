'use client';

import type { ReactNode } from 'react';
import { DesignLayoutControls } from '@/components/forms/form-create/design/design-layout-controls';
import { DesignThemeColorPicker } from '@/components/forms/form-create/design/design-theme-color-picker';
import { FormFontSelect } from '@/components/forms/theme/form-font-select';
import {
  BORDER_RADIUS_OPTIONS,
  getBorderRadiusPreviewClass,
  MAX_WIDTH_OPTIONS,
} from '@/lib/form-theme/layout-presets';
import { resolveInputRadius, resolveThemeSizing } from '@/lib/form-theme';
import {
  type FormTheme,
  type FormThemeSizing,
} from '@/lib/form-theme';
import { pillTabClassName, pillTabGroupClassName } from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

interface DesignCustomizeSectionsProps {
  theme: FormTheme;
  onThemeChange: (theme: FormTheme) => void;
}

function CustomizeSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/40 p-4 last:mb-0">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      {children}
    </section>
  );
}

function FieldRow({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      {children}
    </div>
  );
}

function SizeInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      dir="ltr"
      className={cn(
        'h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)]',
        'px-2.5 font-mono text-sm text-[var(--foreground)] outline-none',
        'focus:border-[var(--foreground)]/25 focus:ring-2 focus:ring-[var(--accent)]/30',
      )}
    />
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <FieldRow label={label}>
      <DesignThemeColorPicker label={label} value={value} onChange={onChange} />
    </FieldRow>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <FieldRow label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)]',
          'px-2.5 text-sm text-[var(--foreground)] outline-none',
          'focus:border-[var(--foreground)]/25 focus:ring-2 focus:ring-[var(--accent)]/30',
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldRow>
  );
}

export function DesignCustomizeSections({
  theme,
  onThemeChange,
}: DesignCustomizeSectionsProps) {
  const sizing = resolveThemeSizing(theme);

  function patchSizing(patch: Partial<FormThemeSizing>) {
    onThemeChange({
      ...theme,
      sizing: { ...sizing, ...theme.sizing, ...patch },
    });
  }

  function patchColors(patch: {
    background?: string;
    card?: string;
    primary?: string;
    input?: Partial<FormTheme['colors']['input']>;
    text?: Partial<FormTheme['colors']['text']>;
    button?: Partial<FormTheme['colors']['button']>;
  }) {
    onThemeChange({
      ...theme,
      colors: {
        ...theme.colors,
        ...(patch.background !== undefined ? { background: patch.background } : {}),
        ...(patch.card !== undefined ? { card: patch.card } : {}),
        ...(patch.primary !== undefined ? { primary: patch.primary } : {}),
        input: { ...theme.colors.input, ...patch.input },
        text: { ...theme.colors.text, ...patch.text },
        button: { ...theme.colors.button, ...patch.button },
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <CustomizeSection title="تخطيط الصفحة">
        <div className="space-y-3">
          <FieldRow label="الخط">
            <FormFontSelect
              value={theme.typography.fontFamily}
              onChange={(fontFamily) =>
                onThemeChange({
                  ...theme,
                  typography: { ...theme.typography, fontFamily },
                })
              }
            />
          </FieldRow>

          <div className="grid grid-cols-2 gap-3">
            <SelectInput
              label="عرض الصفحة"
              value={theme.layout.maxWidth}
              onChange={(maxWidth) =>
                onThemeChange({
                  ...theme,
                  layout: {
                    ...theme.layout,
                    maxWidth: maxWidth as FormTheme['layout']['maxWidth'],
                  },
                })
              }
              options={MAX_WIDTH_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />
            <FieldRow label="حجم الخط الأساسي">
              <SizeInput
                value={sizing.baseFontSize}
                onChange={(baseFontSize) => patchSizing({ baseFontSize })}
                placeholder="16px"
              />
            </FieldRow>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ColorInput
              label="خلفية الصفحة"
              value={theme.colors.background}
              onChange={(background) => patchColors({ background })}
            />
            <ColorInput
              label="خلفية البطاقة"
              value={theme.colors.card}
              onChange={(card) => patchColors({ card })}
            />
          </div>

          <FieldRow label="ارتفاع الغلاف">
            <SizeInput
              value={sizing.coverHeight}
              onChange={(coverHeight) => patchSizing({ coverHeight })}
              placeholder="200px أو 25%"
            />
          </FieldRow>
        </div>

        <div className="pt-2">
          <DesignLayoutControls
            theme={theme}
            onThemeChange={onThemeChange}
            embedded
          />
        </div>
      </CustomizeSection>

      <CustomizeSection title="الحقول">
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="عرض الحقل">
            <SizeInput
              value={sizing.inputMaxWidth}
              onChange={(inputMaxWidth) => patchSizing({ inputMaxWidth })}
              placeholder="100%"
            />
          </FieldRow>
          <FieldRow label="ارتفاع الحقل">
            <SizeInput
              value={sizing.inputHeight}
              onChange={(inputHeight) => patchSizing({ inputHeight })}
              placeholder="40px"
            />
          </FieldRow>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ColorInput
            label="خلفية الحقل"
            value={theme.colors.input.background}
            onChange={(background) =>
              patchColors({ input: { background } })
            }
          />
          <ColorInput
            label="لون placeholder"
            value={theme.colors.text.placeholder}
            onChange={(placeholder) => patchColors({ text: { placeholder } })}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <ColorInput
            label="لون الحد"
            value={theme.colors.input.border}
            onChange={(border) => patchColors({ input: { border } })}
          />
          <FieldRow label="سمك الحد">
            <SizeInput
              value={sizing.inputBorderWidth}
              onChange={(inputBorderWidth) => patchSizing({ inputBorderWidth })}
              placeholder="1px"
            />
          </FieldRow>
        </div>

        <div className="mt-3 space-y-2">
          <FieldRow label="استدارة الحقل (rounded)">
            <SizeInput
              value={sizing.inputRadius}
              onChange={(inputRadius) => patchSizing({ inputRadius })}
              placeholder="8px"
            />
          </FieldRow>
          <div className={cn(pillTabGroupClassName, 'flex-wrap gap-1.5')}>
            {BORDER_RADIUS_OPTIONS.map((opt) => {
              const active =
                sizing.inputRadius === opt.value ||
                resolveInputRadius(sizing.inputRadius) ===
                  resolveInputRadius(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => patchSizing({ inputRadius: opt.hint })}
                  className={pillTabClassName(
                    active,
                    'inline-flex min-h-8 items-center gap-1.5 px-2.5 py-1.5 text-xs',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'size-3 shrink-0 border border-current bg-[var(--surface-secondary)]',
                      getBorderRadiusPreviewClass(opt.value),
                    )}
                  />
                  {opt.label}
                  <span className="font-mono text-[10px] opacity-60" dir="ltr">
                    {opt.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <FieldRow label="حشو أفقي">
            <SizeInput
              value={sizing.inputPaddingX}
              onChange={(inputPaddingX) => patchSizing({ inputPaddingX })}
              placeholder="12px"
            />
          </FieldRow>
        </div>

        <div className="mt-3">
          <ColorInput
            label="لون التركيز"
            value={theme.colors.input.focusBorder}
            onChange={(focusBorder) =>
              patchColors({ input: { focusBorder } })
            }
          />
        </div>
      </CustomizeSection>

      <CustomizeSection title="الأزرار">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ColorInput
            label="خلفية الزر"
            value={theme.colors.button.background}
            onChange={(background) =>
              patchColors({
                button: { background },
                primary: background,
              })
            }
          />
          <ColorInput
            label="لون نص الزر"
            value={theme.colors.button.text}
            onChange={(text) => patchColors({ button: { text } })}
          />
        </div>

        <div className="mt-3">
          <ColorInput
            label="لون hover"
            value={theme.colors.button.hover}
            onChange={(hover) => patchColors({ button: { hover } })}
          />
        </div>
      </CustomizeSection>
    </div>
  );
}
