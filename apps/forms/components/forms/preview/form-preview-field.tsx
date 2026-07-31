'use client';

import type { FormField } from '@/lib/forms-api';
import {
  getScaleMidLabel,
  isLayoutFieldType,
  parseFieldOptions,
  parseGovernorateFieldOptions,
} from '@/lib/form-field-utils';
import { MatrixFieldInput } from '@/components/forms/form-create/fields/matrix-field-input';
import { parseMatrixFieldData } from '@rukny/forms-shared/matrix-field-utils';
import {
  getImageFieldRules,
  getLegalConsentRules,
  getYesNoLabels,
} from '@/lib/form-field-special';
import { cn } from '@/lib/utils';

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]/40';

const inputClassThemed =
  'pf-input w-full border border-[color:var(--form-input-border)] bg-white px-3.5 py-3 text-sm text-[color:var(--form-input-text)] outline-none transition-[border-color,box-shadow] placeholder:text-[color:var(--form-text-placeholder)] focus:outline-none';

function fieldInputClass(themed?: boolean) {
  return themed ? inputClassThemed : inputClass;
}

function ThemedChoiceList({
  fieldLabel,
  options,
  value,
  onChange,
}: {
  fieldLabel: string;
  options: { value: string; label: string }[];
  value: unknown;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="pf-choice-list"
      role="radiogroup"
      aria-label={fieldLabel}
    >
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

function ThemedMultiChoiceList({
  fieldLabel,
  options,
  value,
  onChange,
}: {
  fieldLabel: string;
  options: { value: string; label: string }[];
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

function MultiChoiceList({
  fieldLabel,
  options,
  value,
  onChange,
}: {
  fieldLabel: string;
  options: { value: string; label: string }[];
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
    <div className="flex flex-col gap-2" role="group" aria-label={fieldLabel}>
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            role="checkbox"
            aria-checked={selected}
            onClick={() => toggle(opt.value)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-start text-sm transition-colors',
              selected
                ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--foreground)]'
                : 'border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface-secondary)]',
            )}
          >
            <span
              className={cn(
                'inline-flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                selected
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                  : 'border-[var(--border)] bg-white',
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
            <span className="min-w-0 flex-1">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function questionWrapClass(themed?: boolean) {
  return cn(
    'public-form-field',
    themed ? 'public-form-field--question' : 'space-y-2.5',
  );
}

interface FormPreviewFieldProps {
  field: FormField | { id: string; label: string; type: string; required?: boolean; placeholder?: string | null; description?: string | null; options?: unknown; minValue?: number | null; maxValue?: number | null; minLabel?: string | null; maxLabel?: string | null; validationRules?: unknown };
  value: unknown;
  onChange: (value: unknown) => void;
  index?: number;
  themed?: boolean;
}

export function FormPreviewField({
  field,
  value,
  onChange,
  index,
  themed,
}: FormPreviewFieldProps) {
  const ic = fieldInputClass(themed);
  const type = field.type;

  if (isLayoutFieldType(type)) {
    if (type === 'DIVIDER') {
      return (
        <hr
          className={cn('public-form-field my-4', !themed && 'border-[var(--border)]')}
          style={themed ? { borderColor: 'var(--form-input-border)' } : undefined}
        />
      );
    }
    if (type === 'HEADING' || type === 'TITLE') {
      return (
        <h2
          className={cn(
            'public-form-field text-lg font-bold sm:text-xl',
            themed && 'pt-4 text-start',
            !themed && 'text-[var(--foreground)]',
          )}
          style={themed ? { color: 'var(--form-text-heading)' } : undefined}
        >
          {field.label}
        </h2>
      );
    }
    if (type === 'PARAGRAPH' || type === 'LABEL') {
      return (
        <p
          className={cn(
            'public-form-field whitespace-pre-wrap text-sm leading-relaxed',
            !themed && 'text-[var(--muted-foreground)]',
          )}
          style={themed ? { color: 'var(--form-text-body)' } : undefined}
        >
          {field.label}
        </p>
      );
    }
    if (type === 'IMAGE') {
      const { imageUrl, alt } = getImageFieldRules(
        (field as { validationRules?: unknown }).validationRules,
      );
      if (!imageUrl?.trim()) {
        return (
          <div className="public-form-field rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/40 px-4 py-8 text-center text-xs text-[var(--muted-foreground)]">
            أضف رابط الصورة من إعدادات الحقل
          </div>
        );
      }
      return (
        <div className="public-form-field">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={alt || field.label}
            className="max-h-80 w-full rounded-xl object-cover"
          />
        </div>
      );
    }
    return null;
  }

  const label = (
    <label
      htmlFor={field.id}
      className={cn(
        'block text-start',
        themed ? 'public-form-field__label' : 'text-sm font-medium text-[var(--foreground)]',
      )}
    >
      {index != null ? `${index}. ` : ''}
      {field.label}
      {field.required ? (
        <span className="ms-1 text-[var(--danger)]" aria-hidden>
          *
        </span>
      ) : null}
    </label>
  );

  const unsupported = ['VIDEO', 'AUDIO', 'EMBED'].includes(type);

  if (unsupported) {
    return (
      <div className="public-form-field space-y-1">
        {label}
        <p className="rounded-xl bg-[var(--surface-secondary)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
          معاينة هذا النوع ({type}) غير متاحة هنا.
        </p>
      </div>
    );
  }

  const desc = field.description ? (
    <p
      className={cn('text-xs', !themed && 'text-[var(--muted-foreground)]')}
      style={themed ? { color: 'var(--form-text-body)' } : undefined}
    >
      {field.description}
    </p>
  ) : null;

  if (type === 'RECAPTCHA') {
    return (
      <p className="rounded-xl bg-[var(--surface-secondary)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
        Cloudflare Turnstile — يُفعَّل على النموذج العام بعد النشر.
      </p>
    );
  }

  if (type === 'RESPONDENT_COUNTRY') {
    if (themed) return null;
    return (
      <div className="public-form-field space-y-2">
        {label}
        <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/40 px-3 py-2.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
          <span className="font-medium text-[var(--foreground)]">يُكتشف تلقائياً</span>{' '}
          — يُسجّل بلد المستجيب من IP عند الإرسال ولا يظهر للمستجيب في
          النموذج المنشور.
        </p>
      </div>
    );
  }

  if (type === 'SIGNATURE') {
    return (
      <div className="public-form-field space-y-2.5">
        {label}
        {desc}
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/50 text-xs text-[var(--muted-foreground)]">
          منطقة التوقيع
        </div>
      </div>
    );
  }

  if (type === 'MATRIX') {
    const matrix = parseMatrixFieldData(field);
    return (
      <div className={questionWrapClass(themed)}>
        {label}
        {desc}
        <MatrixFieldInput
          fieldId={field.id}
          matrix={matrix}
          value={value}
          onChange={onChange}
          themed={themed}
        />
      </div>
    );
  }

  if (type === 'RANKING') {
    return (
      <div className="public-form-field space-y-2.5">
        {label}
        {desc}
        <p className="rounded-xl bg-[var(--surface-secondary)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
          ترتيب الخيارات — معاينة تفاعلية بعد النشر.
        </p>
      </div>
    );
  }

  if (type === 'TEXTAREA') {
    return (
      <div className={questionWrapClass(themed)}>
        {label}
        {desc}
        <textarea
          id={field.id}
          rows={4}
          className={cn(ic, 'min-h-[100px] resize-y')}
          placeholder={field.placeholder ?? undefined}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          readOnly={false}
        />
      </div>
    );
  }

  if (type === 'SELECT' || type === 'MULTISELECT') {
    const opts = parseFieldOptions(field.options);
    if (type === 'MULTISELECT') {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className={questionWrapClass(themed)}>
          {label}
          {desc}
          {themed ? (
            <ThemedMultiChoiceList
              fieldLabel={field.label}
              options={opts}
              value={selected}
              onChange={onChange}
            />
          ) : (
            <MultiChoiceList
              fieldLabel={field.label}
              options={opts}
              value={selected}
              onChange={onChange}
            />
          )}
        </div>
      );
    }
    if (themed) {
      return (
        <div className={questionWrapClass(themed)}>
          {label}
          {desc}
          <ThemedChoiceList
            fieldLabel={field.label}
            options={opts}
            value={value}
            onChange={onChange}
          />
        </div>
      );
    }
    return (
      <div className="public-form-field space-y-2.5">
        {label}
        {desc}
        <select
          id={field.id}
          className={ic}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">اختر…</option>
          {opts.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'RADIO') {
    const opts = parseFieldOptions(field.options);
    if (themed) {
      return (
        <div className={questionWrapClass(themed)}>
          {label}
          {desc}
          <ThemedChoiceList
            fieldLabel={field.label}
            options={opts}
            value={value}
            onChange={onChange}
          />
        </div>
      );
    }
    return (
      <div className="public-form-field space-y-2.5">
        {label}
        {desc}
        <div className="public-form-field space-y-2.5">
          {opts.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name={field.id}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="size-4 accent-[var(--primary)]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'YES_NO') {
    const { yes, no } = getYesNoLabels(
      (field as { validationRules?: unknown }).validationRules,
    );
    return (
      <div className="public-form-field space-y-2.5">
        {label}
        {desc}
        <div className="flex flex-wrap gap-2">
          {[
            { key: true, text: yes },
            { key: false, text: no },
          ].map((opt) => (
            <button
              key={String(opt.key)}
              type="button"
              onClick={() => onChange(opt.key)}
              className={cn(
                'min-w-20 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
                value === opt.key
                  ? 'border-[var(--primary)] bg-[var(--accent)]/20 text-[var(--foreground)]'
                  : 'border-[var(--border)] hover:bg-[var(--surface-secondary)]',
              )}
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'LEGAL_CONSENT') {
    const consent = getLegalConsentRules(
      (field as { validationRules?: unknown }).validationRules,
    );
    return (
      <div className="public-form-field space-y-2.5">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            id={field.id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-1 size-4 accent-[var(--primary)]"
          />
          <span>
            <span className="font-medium text-[var(--foreground)]">
              {consent.consentText}
            </span>
            {field.required ? (
              <span className="ms-1 text-[var(--danger)]">*</span>
            ) : null}
            {consent.linkUrl ? (
              <a
                href={consent.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-xs font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
              >
                {consent.linkLabel || 'اقرأ الشروط'}
              </a>
            ) : null}
          </span>
        </label>
      </div>
    );
  }

  if (type === 'IRAQ_GOVERNORATE') {
    const opts = parseGovernorateFieldOptions(field.options);
    if (themed) {
      return (
        <div className={questionWrapClass(themed)}>
          {label}
          {desc}
          <ThemedChoiceList
            fieldLabel={field.label}
            options={opts}
            value={value}
            onChange={onChange}
          />
        </div>
      );
    }
    return (
      <div className="public-form-field space-y-2.5">
        {label}
        {desc}
        <select
          id={field.id}
          className={ic}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">اختر المحافظة…</option>
          {opts.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'CHECKBOX' || type === 'TOGGLE') {
    return (
      <div className="public-form-field space-y-2.5">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            id={field.id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-1 size-4 accent-[var(--primary)]"
          />
          <span>
            <span className="font-medium text-[var(--foreground)]">
              {field.label}
            </span>
            {field.required ? (
              <span className="ms-1 text-[var(--danger)]">*</span>
            ) : null}
            {desc}
          </span>
        </label>
      </div>
    );
  }

  if (type === 'FILE') {
    return (
      <div className="public-form-field space-y-2.5">
        {label}
        {desc}
        <input
          id={field.id}
          type="file"
          className={cn(
            ic,
            'cursor-pointer file:me-3 file:rounded-lg file:border-0 file:bg-[var(--surface-secondary)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--foreground)]',
          )}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onChange({ name: file.name, size: file.size, type: file.type });
            } else {
              onChange(null);
            }
          }}
        />
      </div>
    );
  }

  if (type === 'RATING' || type === 'SCALE' || type === 'NPS') {
    const min = type === 'NPS' ? 0 : (field.minValue ?? 1);
    const max = type === 'NPS' ? 10 : (field.maxValue ?? 5);
    const midLabel = getScaleMidLabel(
      (field as { validationRules?: unknown }).validationRules,
    );
    const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return (
      <div className="public-form-field space-y-2.5">
        {label}
        {desc}
        <div className="flex flex-wrap gap-2">
          {nums.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                'min-w-10 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                value === n
                  ? 'border-[var(--primary)] bg-[var(--accent)]/20 text-[var(--foreground)]'
                  : 'border-[var(--border)] hover:bg-[var(--surface-secondary)]',
              )}
            >
              {n}
            </button>
          ))}
        </div>
        {(field.minLabel || midLabel || field.maxLabel) && (
          <div className="grid grid-cols-3 gap-2 text-xs text-[var(--muted-foreground)]">
            <span className="text-start">{field.minLabel}</span>
            <span className="text-center">{midLabel}</span>
            <span className="text-end">{field.maxLabel}</span>
          </div>
        )}
      </div>
    );
  }

  const inputType =
    type === 'EMAIL'
      ? 'email'
      : type === 'PHONE'
        ? 'tel'
        : type === 'NUMBER'
          ? 'number'
          : type === 'URL'
            ? 'url'
            : type === 'DATE'
              ? 'date'
              : type === 'TIME'
                ? 'time'
                : type === 'DATETIME'
                  ? 'datetime-local'
                  : 'text';

  return (
    <div className={questionWrapClass(themed)}>
      {label}
      {desc}
      <input
        id={field.id}
        type={inputType}
        className={ic}
        placeholder={field.placeholder ?? undefined}
        value={value == null ? '' : String(value)}
        min={type === 'NUMBER' && field.minValue != null ? field.minValue : undefined}
        max={type === 'NUMBER' && field.maxValue != null ? field.maxValue : undefined}
        onChange={(e) =>
          onChange(
            type === 'NUMBER' && e.target.value !== ''
              ? Number(e.target.value)
              : e.target.value,
          )
        }
      />
    </div>
  );
}
