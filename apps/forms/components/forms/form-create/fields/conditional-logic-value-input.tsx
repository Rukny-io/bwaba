'use client';

import { fieldInputClass } from '@/components/forms/shared/form-field-input-class';
import type { ValueInputConfig } from '@/lib/conditional-logic-field-utils';
import { cn } from '@/lib/utils';

export function ConditionalLogicValueInput({
  config,
  value,
  onChange,
}: {
  config: ValueInputConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  if (config.kind === 'none') return null;

  const inputClass = cn(fieldInputClass, 'w-full px-3 py-2 text-sm');

  let control: React.ReactNode;

  switch (config.kind) {
    case 'select':
    case 'boolean':
      control = (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="">— اختر —</option>
          {(config.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
      break;
    case 'number':
      control = (
        <input
          type="number"
          value={value}
          min={config.min}
          max={config.max}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          className={inputClass}
        />
      );
      break;
    case 'date':
      control = (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
      break;
    case 'time':
      control = (
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
      break;
    case 'datetime':
      control = (
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
      break;
    case 'email':
      control = (
        <input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          className={inputClass}
          dir="ltr"
        />
      );
      break;
    case 'tel':
    case 'url':
      control = (
        <input
          type={config.kind}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          className={inputClass}
          dir="ltr"
        />
      );
      break;
    default:
      control = (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          className={inputClass}
        />
      );
  }

  return (
    <label className="block space-y-1">
      <span className="text-[11px] text-[var(--muted-foreground)]">القيمة</span>
      {control}
      {config.hint ? (
        <span className="block text-[10px] leading-relaxed text-[var(--muted-foreground)]">
          {config.hint}
        </span>
      ) : null}
    </label>
  );
}
