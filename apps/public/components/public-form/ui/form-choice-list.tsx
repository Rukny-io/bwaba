'use client';

import { cn } from '@/lib/utils';

export type FormChoiceOption = { value: string; label: string };

export function FormChoiceList({
  fieldLabel,
  options,
  value,
  onChange,
}: {
  fieldLabel: string;
  options: FormChoiceOption[];
  value: unknown;
  onChange: (value: string) => void;
}) {
  return (
    <div className="pf-choice-list" role="radiogroup" aria-label={fieldLabel}>
      {options.map((opt, i) => {
        const selected = value === opt.value;
        const letter = String.fromCharCode(65 + (i % 26));
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cn('pf-choice', selected && 'pf-choice--selected')}
          >
            <span className="pf-choice__key" aria-hidden>
              {letter}
            </span>
            <span className="pf-choice__label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function FormMultiChoiceList({
  fieldLabel,
  options,
  value,
  onChange,
}: {
  fieldLabel: string;
  options: FormChoiceOption[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  function toggle(optValue: string) {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  }

  return (
    <div className="pf-choice-list" role="group" aria-label={fieldLabel}>
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            role="checkbox"
            aria-checked={selected}
            onClick={() => toggle(opt.value)}
            className={cn('pf-choice', selected && 'pf-choice--selected')}
          >
            <span
              className={cn(
                'pf-choice__key pf-choice__key--multi',
                selected && 'pf-choice__key--multi-selected',
              )}
              aria-hidden
            >
              {selected ? (
                <svg
                  viewBox="0 0 12 12"
                  className="size-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 6l2.5 2.5 4.5-5" />
                </svg>
              ) : null}
            </span>
            <span className="pf-choice__label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
