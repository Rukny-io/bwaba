'use client';

import type { FormField } from '@/lib/forms-types';
import {
  getScaleMidLabel,
  isLayoutFieldType,
  parseFieldOptions,
  parseGovernorateFieldOptions,
  fieldRequiresEmailVerification,
  fieldRequiresPhoneWhatsappVerification,
} from '@/lib/form-field-utils';
import { FieldEmailVerification } from '@/components/public-form/field-email-verification';
import { FieldPhoneVerification } from '@/components/public-form/field-phone-verification';
import { MatrixFieldInput } from '@/components/forms/matrix-field-input';
import {
  FormCheckboxField,
  FormChoiceList,
  FormFieldShell,
  FormFileField,
  FormMultiChoiceList,
  FormRankingList,
  FormScalePicker,
  FormSelect,
  FormSwitchField,
  FormTextArea,
  FormTextField,
} from '@/components/public-form/ui';
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
  slug?: string;
  fieldError?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  onEmailVerifiedChange?: (verified: boolean) => void;
  onPhoneVerifiedChange?: (verified: boolean) => void;
}

export function FormPreviewField({
  field,
  value,
  onChange,
  index,
  themed,
  slug,
  fieldError,
  emailVerified = false,
  phoneVerified = false,
  onEmailVerifiedChange,
  onPhoneVerifiedChange,
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

  const labelContent = (
    <>
      {index != null ? `${index}. ` : ''}
      {field.label}
      {field.required ? (
        <span className="ms-1 text-[var(--danger)]" aria-hidden>
          *
        </span>
      ) : null}
    </>
  );

  const label = (
    <label
      htmlFor={field.id}
      className={cn(
        'block text-start',
        themed ? 'public-form-field__label' : 'text-sm font-medium text-[var(--foreground)]',
      )}
    >
      {labelContent}
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
        {themed ? (
          <FormFieldShell
            label={labelContent}
            description={field.description}
            error={fieldError}
          >
            <MatrixFieldInput
              fieldId={field.id}
              matrix={matrix}
              value={value}
              onChange={onChange}
              themed={themed}
            />
          </FormFieldShell>
        ) : (
          <>
            {label}
            {desc}
            <MatrixFieldInput
              fieldId={field.id}
              matrix={matrix}
              value={value}
              onChange={onChange}
              themed={themed}
            />
          </>
        )}
      </div>
    );
  }

  if (type === 'RANKING') {
    const opts = parseFieldOptions(field.options);
    if (themed) {
      return (
        <div className={questionWrapClass(themed)}>
          <FormFieldShell
            label={labelContent}
            description={field.description}
            error={fieldError}
          >
            <FormRankingList
              fieldLabel={field.label}
              options={opts}
              value={value}
              onChange={onChange}
            />
          </FormFieldShell>
        </div>
      );
    }

    return (
      <div className="public-form-field space-y-2.5">
        {label}
        {desc}
        <FormRankingList
          fieldLabel={field.label}
          options={opts}
          value={value}
          onChange={onChange}
        />
      </div>
    );
  }

  if (type === 'TEXTAREA') {
    if (themed) {
      return (
        <div className={questionWrapClass(themed)}>
          <FormTextArea
            id={field.id}
            label={labelContent}
            description={field.description}
            value={String(value ?? '')}
            onChange={(v) => onChange(v)}
            placeholder={field.placeholder ?? undefined}
            required={field.required}
            error={fieldError}
          />
        </div>
      );
    }

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
          {themed ? (
            <FormFieldShell
              label={labelContent}
              description={field.description}
              error={fieldError}
            >
              <FormMultiChoiceList
                fieldLabel={field.label}
                options={opts}
                value={selected}
                onChange={onChange}
              />
            </FormFieldShell>
          ) : (
            <>
              {label}
              {desc}
              <MultiChoiceList
                fieldLabel={field.label}
                options={opts}
                value={selected}
                onChange={onChange}
              />
            </>
          )}
        </div>
      );
    }
    if (themed) {
      return (
        <div className={questionWrapClass(themed)}>
          <FormFieldShell label={labelContent} description={field.description} error={fieldError}>
            <FormChoiceList
              fieldLabel={field.label}
              options={opts}
              value={value}
              onChange={onChange}
            />
          </FormFieldShell>
        </div>
      );
    }
    return (
      <div className="public-form-field space-y-2.5">
        {label}
        {desc}
        <FormSelect
          id={field.id}
          label={labelContent}
          value={String(value ?? '')}
          onChange={onChange}
          options={opts}
          placeholder="اختر…"
          required={field.required}
          error={fieldError}
        />
      </div>
    );
  }

  if (type === 'RADIO') {
    const opts = parseFieldOptions(field.options);
    if (themed) {
      return (
        <div className={questionWrapClass(themed)}>
          <FormFieldShell label={labelContent} description={field.description} error={fieldError}>
            <FormChoiceList
              fieldLabel={field.label}
              options={opts}
              value={value}
              onChange={onChange}
            />
          </FormFieldShell>
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
    const yesNoOpts = [
      { value: 'true', label: yes },
      { value: 'false', label: no },
    ];
    const yesNoValue =
      value === true || value === 'true'
        ? 'true'
        : value === false || value === 'false'
          ? 'false'
          : '';

    if (themed) {
      return (
        <div className={questionWrapClass(themed)}>
          <FormFieldShell label={labelContent} description={field.description} error={fieldError}>
            <FormChoiceList
              fieldLabel={field.label}
              options={yesNoOpts}
              value={yesNoValue}
              onChange={(v) => onChange(v === 'true')}
            />
          </FormFieldShell>
        </div>
      );
    }

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
    const consentLabel = (
      <>
        {consent.consentText}
        {field.required ? (
          <span className="ms-1 text-[var(--danger)]" aria-hidden>
            *
          </span>
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
      </>
    );

    if (themed) {
      return (
        <div className={questionWrapClass(themed)}>
          <FormCheckboxField
            id={field.id}
            label={consentLabel}
            checked={Boolean(value)}
            onChange={onChange}
            required={field.required}
            error={fieldError}
          />
        </div>
      );
    }

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
          <FormSelect
            id={field.id}
            label={labelContent}
            description={field.description}
            value={String(value ?? '')}
            onChange={onChange}
            options={opts}
            placeholder="اختر المحافظة…"
            required={field.required}
            error={fieldError}
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
    if (themed && type === 'TOGGLE') {
      return (
        <div className={questionWrapClass(themed)}>
          <FormSwitchField
            id={field.id}
            label={labelContent}
            description={field.description}
            checked={Boolean(value)}
            onChange={onChange}
            required={field.required}
            error={fieldError}
          />
        </div>
      );
    }

    if (themed) {
      return (
        <div className={questionWrapClass(themed)}>
          <FormCheckboxField
            id={field.id}
            label={labelContent}
            description={field.description}
            checked={Boolean(value)}
            onChange={onChange}
            required={field.required}
            error={fieldError}
          />
        </div>
      );
    }

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
    const fileField = field as FormField;
    if (themed) {
      return (
        <div className={questionWrapClass(themed)}>
          <FormFieldShell
            label={labelContent}
            description={field.description}
            error={fieldError}
          >
            <FormFileField
              id={field.id}
              slug={slug}
              value={value}
              onChange={onChange}
              allowedMimes={fileField.allowedFileTypes}
              maxBytes={fileField.maxFileSize ?? undefined}
            />
          </FormFieldShell>
        </div>
      );
    }

    return (
      <div className="public-form-field space-y-2.5">
        {label}
        {desc}
        <FormFileField
          id={field.id}
          slug={slug}
          value={value}
          onChange={onChange}
          allowedMimes={fileField.allowedFileTypes}
          maxBytes={fileField.maxFileSize ?? undefined}
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

    if (themed) {
      return (
        <div className={questionWrapClass(themed)}>
          <FormFieldShell label={labelContent} description={field.description} error={fieldError}>
            <FormScalePicker
              min={min}
              max={max}
              value={value}
              onChange={onChange}
              minLabel={field.minLabel}
              midLabel={midLabel}
              maxLabel={field.maxLabel}
            />
          </FormFieldShell>
        </div>
      );
    }

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

  const stringValue = value == null ? '' : String(value);

  if (type === 'EMAIL' && fieldRequiresEmailVerification(field.validationRules) && slug) {
    return (
      <div className={questionWrapClass(themed)}>
        {label}
        {desc}
        <FieldEmailVerification
          slug={slug}
          fieldId={field.id}
          value={stringValue}
          onChange={(v) => onChange(v)}
          placeholder={field.placeholder ?? undefined}
          verified={emailVerified}
          onVerifiedChange={onEmailVerifiedChange ?? (() => {})}
          themed={themed}
          error={fieldError}
        />
      </div>
    );
  }

  if (
    type === 'PHONE' &&
    fieldRequiresPhoneWhatsappVerification(field.validationRules) &&
    slug
  ) {
    return (
      <div className={questionWrapClass(themed)}>
        {label}
        {desc}
        <FieldPhoneVerification
          slug={slug}
          fieldId={field.id}
          value={stringValue}
          onChange={(v) => onChange(v)}
          placeholder={field.placeholder ?? undefined}
          verified={phoneVerified}
          onVerifiedChange={onPhoneVerifiedChange ?? (() => {})}
          themed={themed}
          error={fieldError}
        />
      </div>
    );
  }

  if (themed) {
    return (
      <div className={questionWrapClass(themed)}>
        <FormTextField
          id={field.id}
          label={labelContent}
          description={field.description}
          value={stringValue}
          onChange={(next) =>
            onChange(
              type === 'NUMBER' && next !== '' ? Number(next) : next,
            )
          }
          type={inputType}
          placeholder={field.placeholder ?? undefined}
          required={field.required}
          error={fieldError}
          min={type === 'NUMBER' && field.minValue != null ? field.minValue : undefined}
          max={type === 'NUMBER' && field.maxValue != null ? field.maxValue : undefined}
          dir={type === 'PHONE' || type === 'NUMBER' ? 'ltr' : undefined}
        />
      </div>
    );
  }

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
      {fieldError ? (
        <p className="mt-1.5 text-xs text-red-600" role="alert">
          {fieldError}
        </p>
      ) : null}
    </div>
  );
}
