'use client';

import { useCallback, useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import {
  Button,
  InputGroup,
  Label,
  TextField,
  cn,
} from '@heroui/react';
import { AnimatedNumber } from '@/components/ui/animated-number';

export const PRODUCT_PRICE_STEP = 250;

function formatPricePreview(value: number): string {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)} د.ع`;
}

interface ProductPriceFieldProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function parsePriceDigits(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPriceDigits(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProductPriceField({
  value,
  onChange,
  className,
}: ProductPriceFieldProps) {
  const [display, setDisplay] = useState(() => {
    const parsed = parsePriceDigits(value);
    return parsed === null ? '' : formatPriceDigits(parsed);
  });
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (focused) return;
    const parsed = parsePriceDigits(value);
    setDisplay(parsed === null ? '' : formatPriceDigits(parsed));
  }, [focused, value]);

  const numericValue = parsePriceDigits(display) ?? parsePriceDigits(value);
  const hasPrice = numericValue !== null && numericValue > 0;

  const applyValue = useCallback(
    (next: number | null) => {
      if (next === null || next <= 0) {
        onChange('');
        setDisplay('');
        return;
      }

      onChange(String(next));
      setDisplay(formatPriceDigits(next));
    },
    [onChange],
  );

  const stepPrice = useCallback(
    (delta: number) => {
      const current = parsePriceDigits(display) ?? parsePriceDigits(value) ?? 0;
      applyValue(Math.max(0, current + delta));
    },
    [applyValue, display, value],
  );

  const handleDisplayChange = useCallback(
    (raw: string) => {
      const parsed = parsePriceDigits(raw);
      if (parsed === null) {
        onChange('');
        setDisplay('');
        return;
      }

      onChange(String(parsed));
      setDisplay(formatPriceDigits(parsed));
    },
    [onChange],
  );

  const stopGroupFocus = (event: React.PointerEvent) => {
    event.stopPropagation();
  };

  return (
    <TextField
      value={display}
      onChange={handleDisplayChange}
      className={cn('product-price-field flex flex-col gap-2', className)}
    >
      <Label className="text-xs font-medium text-muted">السعر</Label>

      <InputGroup
        variant="secondary"
        fullWidth
        className="product-price-field__group gap-0 p-0.5"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label="إنقاص ٢٥٠ دينار"
          className="product-price-field__step size-7 min-w-7 shrink-0 rounded-lg text-muted"
          onPointerDown={stopGroupFocus}
          onPress={() => stepPrice(-PRODUCT_PRICE_STEP)}
        >
          <Minus className="size-3.5" strokeWidth={2.25} aria-hidden />
        </Button>

        <InputGroup.Input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          placeholder="0"
          className="min-w-0 flex-1 px-2 text-end text-base font-semibold tabular-nums tracking-tight"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              stepPrice(PRODUCT_PRICE_STEP);
            }
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              stepPrice(-PRODUCT_PRICE_STEP);
            }
          }}
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label="زيادة ٢٥٠ دينار"
          className="product-price-field__step size-7 min-w-7 shrink-0 rounded-lg text-muted"
          onPointerDown={stopGroupFocus}
          onPress={() => stepPrice(PRODUCT_PRICE_STEP)}
        >
          <Plus className="size-3.5" strokeWidth={2.25} aria-hidden />
        </Button>

        <span className="shrink-0 px-2 text-xs font-medium text-muted">د.ع</span>
      </InputGroup>

      {hasPrice ? (
        <div className="flex justify-end px-0.5">
          <AnimatedNumber
            value={numericValue}
            format={formatPricePreview}
            duration={420}
            animateFromZeroOnMount={false}
            className="text-xs font-semibold text-accent sm:text-sm"
          />
        </div>
      ) : null}
    </TextField>
  );
}
