'use client';

import { FileText, Link2 } from 'lucide-react';
import type { FormField } from '@/lib/forms-api';
import {
  formatRespondentCountryValue,
  isRespondentCountryValue,
} from '@/lib/country-labels';
import { formatFormDate, formatFormDateTime } from '@/lib/forms-format';
import { getIraqGovernorateLabel } from '@/lib/iraq-governorate-options';
import { parseFieldOptions } from '@/lib/form-field-utils';
import {
  formatSubmissionValue,
  isBlankSubmissionValue,
  resolveSignatureImageSrc,
} from '@/lib/submission-utils';
import {
  formDetailCardClass,
  formDetailCardSurfaceClass,
  submissionAnswerInsetClass,
} from '@/lib/form-detail-styles';
import { cn } from '@/lib/utils';

const answerBoxClass = submissionAnswerInsetClass;

function answerBoxClassFor(compact: boolean, extra?: string) {
  return cn(
    answerBoxClass,
    compact && 'inline-block w-fit max-w-full',
    extra,
  );
}

interface SubmissionAnswerDisplayProps {
  field: FormField;
  value: unknown;
  index?: number;
  compact?: boolean;
}

export function SubmissionAnswerDisplay({
  field,
  value,
  index,
  compact = false,
}: SubmissionAnswerDisplayProps) {
  if (isBlankSubmissionValue(value)) {
    return (
      <p className="text-sm italic text-[var(--muted-foreground)]">
        لم يُجب على هذا السؤال
      </p>
    );
  }

  if (field.type === 'FILE') {
    return <FileAnswer value={value} />;
  }

  if (field.type === 'SIGNATURE') {
    return <SignatureAnswer value={value} />;
  }

  if (field.type === 'RESPONDENT_COUNTRY' && isRespondentCountryValue(value)) {
    return (
      <p className={answerBoxClassFor(compact)}>
        <span>{value.countryNameAr}</span>
        <span className="ms-2 text-[var(--muted-foreground)]" dir="ltr">
          ({value.countryCode})
        </span>
      </p>
    );
  }

  if (field.type === 'IRAQ_GOVERNORATE' && typeof value === 'string') {
    return (
      <p className={answerBoxClassFor(compact)}>{getIraqGovernorateLabel(value)}</p>
    );
  }

  if (field.type === 'YES_NO') {
    return (
      <p className={answerBoxClassFor(compact)}>
        {value === true ? 'نعم' : value === false ? 'لا' : '—'}
      </p>
    );
  }

  if (field.type === 'LEGAL_CONSENT') {
    return (
      <p className={answerBoxClassFor(compact)}>
        {value === true ? 'موافق' : 'لم يوافق'}
      </p>
    );
  }

  if (field.type === 'MATRIX' && value && typeof value === 'object') {
    const rows = Object.entries(value as Record<string, string>);
    if (rows.length === 0) {
      return (
        <p className="text-sm italic text-[var(--muted-foreground)]">
          لم يُجب على هذا السؤال
        </p>
      );
    }
    return (
      <ul className="space-y-1.5">
        {rows.map(([row, col]) => (
          <li key={row} className={answerBoxClassFor(compact, 'flex gap-2')}>
            <span className="font-medium">{row}:</span>
            <span>{col}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (field.type === 'RANKING' && Array.isArray(value)) {
    return (
      <ol className="space-y-1.5">
        {(value as string[]).map((item, i) => (
          <li key={`${i}-${item}`} className={answerBoxClassFor(compact, 'flex gap-2')}>
            <span className="font-semibold tabular-nums text-[var(--muted-foreground)]">
              {i + 1}.
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    );
  }

  if (field.type === 'CHECKBOX' || field.type === 'TOGGLE') {
    const checked = value === true || value === 'true' || value === 'نعم';
    return (
      <p className={answerBoxClassFor(compact)}>{checked ? 'نعم' : 'لا'}</p>
    );
  }

  if (
    field.type === 'SELECT' ||
    field.type === 'RADIO' ||
    field.type === 'MULTISELECT'
  ) {
    const text = formatSubmissionValue(value);
    return <p className={answerBoxClassFor(compact)}>{text || '—'}</p>;
  }

  if (field.type === 'RATING' || field.type === 'SCALE' || field.type === 'NPS' || field.type === 'NUMBER') {
    return (
      <p
        className={answerBoxClassFor(
          compact,
          'min-w-[2.5rem] text-center font-semibold tabular-nums',
        )}
      >
        {formatSubmissionValue(value)}
      </p>
    );
  }

  if (field.type === 'URL' && typeof value === 'string' && value.startsWith('http')) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className={answerBoxClassFor(
          compact,
          'inline-flex items-center gap-2 text-[var(--primary)] underline-offset-2 hover:underline',
        )}
      >
        <Link2 className="size-3.5 shrink-0" aria-hidden />
        {value}
      </a>
    );
  }

  if (field.type === 'DATE' && typeof value === 'string') {
    return (
      <p className={answerBoxClassFor(compact)}>{formatFormDate(value)}</p>
    );
  }

  if (field.type === 'TIME' && typeof value === 'string') {
    return <p className={answerBoxClassFor(compact)}>{value}</p>;
  }

  if (field.type === 'DATETIME' && typeof value === 'string') {
    return (
      <p className={answerBoxClassFor(compact)}>{formatFormDateTime(value)}</p>
    );
  }

  const display = formatSubmissionValue(value);
  if (field.type === 'TEXTAREA' || display.includes('\n')) {
    return (
      <p
        className={answerBoxClassFor(
          false,
          'block w-full whitespace-pre-wrap leading-relaxed',
        )}
      >
        {display}
      </p>
    );
  }

  return <p className={answerBoxClassFor(compact)}>{display}</p>;
}

function FileAnswer({ value }: { value: unknown }) {
  if (typeof value === 'string') {
    const isUrl = value.startsWith('http');
    return (
      <div className={cn(answerBoxClass, 'flex items-center gap-2')}>
        <FileText className="size-4 shrink-0 text-[var(--danger)]" aria-hidden />
        {isUrl ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-[var(--primary)] hover:underline"
          >
            {value.split('/').pop() ?? value}
          </a>
        ) : (
          <span className="truncate">{value}</span>
        )}
      </div>
    );
  }

  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    const name = String(o.name ?? o.filename ?? 'ملف');
    const url =
      typeof o.url === 'string'
        ? o.url
        : typeof o.secureUrl === 'string'
          ? o.secureUrl
          : null;
    return (
      <div className={cn(answerBoxClass, 'flex items-center gap-2')}>
        <FileText className="size-4 shrink-0 text-[var(--danger)]" aria-hidden />
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-[var(--primary)] hover:underline"
          >
            {name}
          </a>
        ) : (
          <span className="truncate">{name}</span>
        )}
      </div>
    );
  }

  return <p className={answerBoxClass}>{formatSubmissionValue(value)}</p>;
}

function SignatureAnswer({ value }: { value: unknown }) {
  const src = resolveSignatureImageSrc(value);
  if (!src) {
    return (
      <p className="text-sm italic text-[var(--muted-foreground)]">
        توقيع غير صالح
      </p>
    );
  }

  return (
    <div
      className={cn(answerBoxClass, 'inline-block max-w-full bg-white p-3')}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="توقيع"
        className="max-h-36 max-w-full rounded-lg border border-[var(--border)] object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const fallback = e.currentTarget.nextElementSibling;
          if (fallback) fallback.classList.remove('hidden');
        }}
      />
      <p className="hidden text-xs italic text-[var(--muted-foreground)]">
        تعذّر تحميل صورة التوقيع — أرسل استجابة جديدة بعد التحديث
      </p>
    </div>
  );
}

export function SignatureGallery({ values }: { values: unknown[] }) {
  const sources = values
    .map((v) => resolveSignatureImageSrc(v))
    .filter((src): src is string => Boolean(src));

  if (sources.length === 0) {
    return (
      <p className="text-sm italic text-[var(--muted-foreground)]">
        لا توجد توقيعات
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {sources.map((src, i) => (
        <li
          key={`${i}-${src.slice(0, 32)}`}
          className="rounded-xl border border-[var(--border)] bg-white p-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`توقيع ${i + 1}`}
            className="mx-auto max-h-28 w-full object-contain"
          />
        </li>
      ))}
    </ul>
  );
}

export function SubmissionFieldCard({
  field,
  value,
  index,
  responseCount,
}: {
  field: FormField;
  value?: unknown;
  index?: number;
  responseCount?: number;
}) {
  return (
    <article className={formDetailCardClass}>
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
          {index != null ? `${index}. ` : ''}
          {field.label}
        </h3>
        {responseCount != null ? (
          <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
            {responseCount} {responseCount === 1 ? 'استجابة' : 'استجابات'}
          </span>
        ) : null}
      </header>
      <SubmissionAnswerDisplay field={field} value={value} />
    </article>
  );
}

export function DistributionBars({
  items,
  total,
}: {
  items: { name: string; count: number; percentage: number }[];
  total: number;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.name}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-[var(--foreground)]">
              {item.name}
            </span>
            <span className="shrink-0 tabular-nums text-[var(--muted-foreground)]">
              {item.count} ({item.percentage}%)
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
              style={{
                width: `${total > 0 ? Math.max(item.percentage, item.count > 0 ? 4 : 0) : 0}%`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TextResponseList({ responses }: { responses: string[] }) {
  if (responses.length === 0) {
    return (
      <p className="text-sm italic text-[var(--muted-foreground)]">
        لا توجد إجابات نصية
      </p>
    );
  }

  return (
    <ul className="max-h-80 space-y-2 overflow-y-auto">
      {responses.map((text, i) => (
        <li
          key={`${i}-${text.slice(0, 24)}`}
          className={submissionAnswerInsetClass}
        >
          {text}
        </li>
      ))}
    </ul>
  );
}

export function GroupedAnswerRow({
  label,
  count,
  onClick,
}: {
  label: string;
  count: number;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground)]">
        {label}
      </span>
      <span className="shrink-0 text-sm font-medium text-[var(--primary)] tabular-nums">
        {count} {count === 1 ? 'استجابة' : 'استجابات'}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          submissionAnswerInsetClass,
          'flex w-full items-center justify-between gap-3 text-start transition-colors hover:bg-[var(--surface-secondary)]/70',
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn(
        submissionAnswerInsetClass,
        'flex items-center justify-between gap-3',
      )}
    >
      {content}
    </div>
  );
}

export function getChoiceLabel(
  field: FormField,
  rawValue: string,
): string {
  const opts = parseFieldOptions(field.options);
  const match = opts.find((o) => o.value === rawValue || o.label === rawValue);
  return match?.label ?? rawValue;
}
