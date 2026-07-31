'use client';

import { useMemo } from 'react';
import {
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  Label,
  parseColor,
} from '@heroui/react';
import { normalizeHexColor } from '@/lib/form-theme';
import { cn } from '@/lib/utils';

interface DesignThemeColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  label: string;
  className?: string;
}

export function DesignThemeColorPicker({
  value,
  onChange,
  label,
  className,
}: DesignThemeColorPickerProps) {
  const raw = value.trim();
  const isTransparent = raw.toLowerCase() === 'transparent';
  const hex = isTransparent ? raw : normalizeHexColor(value);

  const colorValue = useMemo(() => {
    try {
      return parseColor(isTransparent ? '#ffffff' : hex);
    } catch {
      return parseColor('#000000');
    }
  }, [hex, isTransparent]);

  function handleColorChange(next: ReturnType<typeof parseColor> | null) {
    if (!next) return;
    const nextHex = next.toString('hex');
    onChange(normalizeHexColor(nextHex.startsWith('#') ? nextHex : `#${nextHex}`));
  }

  return (
    <ColorPicker
      className={cn('w-full', className)}
      value={colorValue}
      onChange={handleColorChange}
    >
      <ColorPicker.Trigger
        aria-label={label}
        className="h-9 w-full min-w-0 justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 shadow-sm shadow-black/[0.02]"
      >
        <span className="flex min-w-0 items-center gap-2">
          <ColorSwatch
            color={colorValue}
            size="xs"
            className={cn('shrink-0', isTransparent && 'opacity-40')}
          />
          <span
            className="truncate font-mono text-xs text-[var(--foreground)]"
            dir="ltr"
          >
            {isTransparent ? 'transparent' : hex}
          </span>
        </span>
      </ColorPicker.Trigger>

      <ColorPicker.Popover
        className="form-design-color-picker-popover gap-2.5"
        placement="bottom"
      >
        <ColorArea
          aria-label={label}
          className="max-w-full"
          colorSpace="hsb"
          xChannel="saturation"
          yChannel="brightness"
        >
          <ColorArea.Thumb />
        </ColorArea>

        <ColorSlider
          aria-label="درجة اللون"
          channel="hue"
          className="gap-1 px-1"
          colorSpace="hsb"
        >
          <Label className="sr-only">درجة اللون</Label>
          <ColorSlider.Track>
            <ColorSlider.Thumb />
          </ColorSlider.Track>
        </ColorSlider>

        <ColorField aria-label={label} className="form-design-color-field">
          <ColorField.Group className="rounded-xl" variant="secondary">
            <ColorField.Prefix>
              <ColorSwatch size="xs" />
            </ColorField.Prefix>
            <ColorField.Input />
          </ColorField.Group>
        </ColorField>
      </ColorPicker.Popover>
    </ColorPicker>
  );
}
