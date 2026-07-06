'use client';

import { Skeleton } from '@heroui/react';
import type {
  FieldSubmissionSummary,
  FormDetail,
  SubmissionsSummaryResponse,
} from '@/lib/forms-api';
import {
  collectRespondentEmails,
  isChoiceFieldType,
  isNumericFieldType,
} from '@/lib/submission-utils';
import {
  DistributionBars,
  SignatureGallery,
  TextResponseList,
} from '@/components/forms/submissions/submission-answer-display';

interface SubmissionsSummaryTabProps {
  form: FormDetail | null;
  summary: SubmissionsSummaryResponse | null;
  respondentEmails: string[];
  loading: boolean;
}

function FieldSummaryCard({
  fieldSummary,
  totalSubmissions,
}: {
  fieldSummary: FieldSubmissionSummary;
  totalSubmissions: number;
}) {
  const blankCount = Math.max(
    0,
    totalSubmissions - fieldSummary.totalResponses,
  );

  const signatureValues =
    fieldSummary.signatureResponses ??
    (fieldSummary.type === 'SIGNATURE' && fieldSummary.textResponses?.length
      ? fieldSummary.textResponses
      : []);

  return (
    <article className="rounded-2xl border border-[var(--border)]/80 bg-[var(--surface)] p-4 shadow-sm shadow-black/[0.02] sm:p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
          {fieldSummary.label}
        </h3>
        <span className="text-xs text-[var(--muted-foreground)]">
          {fieldSummary.totalResponses}{' '}
          {fieldSummary.totalResponses === 1 ? 'استجابة' : 'استجابات'}
        </span>
      </header>

      {blankCount > 0 ? (
        <p className="mb-3 text-sm text-[var(--muted-foreground)]">
          <span className="italic">ترك الحقل فارغاً</span>
          {' · '}
          <span className="font-medium text-[var(--primary)]">
            {blankCount} {blankCount === 1 ? 'استجابة' : 'استجابات'}
          </span>
        </p>
      ) : null}

      {fieldSummary.distribution?.length ? (
        <DistributionBars
          items={fieldSummary.distribution}
          total={fieldSummary.totalResponses}
        />
      ) : null}

      {isNumericFieldType(fieldSummary.type) &&
      fieldSummary.average != null ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">
            المتوسط:{' '}
            <span className="font-semibold text-[var(--foreground)]">
              {fieldSummary.average}
            </span>
            {fieldSummary.min != null && fieldSummary.max != null ? (
              <span>
                {' '}
                (من {fieldSummary.min} إلى {fieldSummary.max})
              </span>
            ) : null}
          </p>
          {fieldSummary.distribution?.length ? (
            <DistributionBars
              items={fieldSummary.distribution}
              total={fieldSummary.totalResponses}
            />
          ) : null}
        </div>
      ) : null}

      {!isChoiceFieldType(fieldSummary.type) &&
      !isNumericFieldType(fieldSummary.type) &&
      fieldSummary.type === 'SIGNATURE' &&
      signatureValues.length > 0 ? (
        <SignatureGallery values={signatureValues} />
      ) : null}

      {!isChoiceFieldType(fieldSummary.type) &&
      !isNumericFieldType(fieldSummary.type) &&
      fieldSummary.type !== 'SIGNATURE' &&
      fieldSummary.textResponses?.length ? (
        <TextResponseList responses={fieldSummary.textResponses} />
      ) : null}

      {fieldSummary.totalResponses === 0 ? (
        <p className="text-sm italic text-[var(--muted-foreground)]">
          لا توجد إجابات لهذا السؤال
        </p>
      ) : null}
    </article>
  );
}

export function SubmissionsSummaryTab({
  form,
  summary,
  respondentEmails,
  loading,
}: SubmissionsSummaryTabProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        تعذّر تحميل الملخص.
      </p>
    );
  }

  if (summary.totalSubmissions === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/40 px-6 py-12 text-center">
        <p className="font-medium text-[var(--foreground)]">
          لا توجد استجابات بعد
        </p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          ستظهر ملخصات الأسئلة هنا عند وصول أول استجابة.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {respondentEmails.length > 0 ? (
        <article className="rounded-2xl border border-[var(--border)]/80 bg-[var(--surface)] p-4 shadow-sm shadow-black/[0.02] sm:p-5">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold sm:text-base">من أجاب؟</h3>
            <span className="text-xs text-[var(--muted-foreground)]">
              {respondentEmails.length} بريد
            </span>
          </header>
          <p className="mb-2 text-xs text-[var(--muted-foreground)]">
            البريد الإلكتروني
          </p>
          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {respondentEmails.slice(0, 50).map((email) => (
              <li
                key={email}
                className="rounded-xl bg-[var(--surface-secondary)] px-3.5 py-2 text-sm text-[var(--foreground)]"
                dir="ltr"
              >
                {email}
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {summary.fields.map((fieldSummary) => (
        <FieldSummaryCard
          key={fieldSummary.fieldId}
          fieldSummary={fieldSummary}
          totalSubmissions={summary.totalSubmissions}
        />
      ))}

      {form?.description ? (
        <p className="text-center text-xs text-[var(--muted-foreground)]">
          {form.title}
        </p>
      ) : null}
    </div>
  );
}
