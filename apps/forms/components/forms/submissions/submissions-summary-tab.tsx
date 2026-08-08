'use client';

import { Skeleton } from '@heroui/react';
import type {
  FieldSubmissionSummary,
  FormDetail,
  SubmissionsSummaryResponse,
} from '@/lib/forms-api';
import {
  isChoiceFieldType,
  isNumericFieldType,
} from '@/lib/submission-utils';
import { DashboardEmptyState } from '@/components/app/dashboard-empty-state';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import {
  formDetailCardClass,
  formDetailCardSurfaceClass,
  submissionAnswerInsetClass,
} from '@/lib/form-detail-styles';
import {
  DistributionBars,
  SignatureGallery,
  TextResponseList,
} from '@/components/forms/submissions/submission-answer-display';
import { cn } from '@/lib/utils';

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
    <article className={formDetailCardClass}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-[var(--foreground)]">
          {fieldSummary.label}
        </h3>
        <span className="text-[12px] text-[var(--muted-foreground)]">
          {fieldSummary.totalResponses}{' '}
          {fieldSummary.totalResponses === 1 ? 'استجابة' : 'استجابات'}
        </span>
      </header>

      {blankCount > 0 ? (
        <p className="text-[13px] text-[var(--muted-foreground)]">
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
          <p className="text-[13px] text-[var(--muted-foreground)]">
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
        <p className="text-[13px] italic text-[var(--muted-foreground)]">
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
      <div className="flex flex-col gap-[12px]">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 w-full rounded-[25px]" />
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <p className="text-[13px] text-[var(--muted-foreground)]">
        تعذّر تحميل الملخص.
      </p>
    );
  }

  if (summary.totalSubmissions === 0) {
    return (
      <DashboardEmptyState
        compact
        title="لا توجد استجابات بعد"
        description="ستظهر ملخصات الأسئلة هنا عند وصول أول استجابة."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {respondentEmails.length > 0 ? (
        <SettingsSectionCard
          plain
          title="من أجاب؟"
          description={`${respondentEmails.length} بريد من الاستجابات المحمّلة`}
        >
          <article className={formDetailCardClass}>
            <p className="text-[12px] text-[var(--muted-foreground)]">
              البريد الإلكتروني
            </p>
            <ul className="flex max-h-48 flex-col gap-[12px] overflow-y-auto">
              {respondentEmails.slice(0, 50).map((email) => (
                <li
                  key={email}
                  className={cn(submissionAnswerInsetClass, 'text-start')}
                  dir="ltr"
                >
                  {email}
                </li>
              ))}
            </ul>
          </article>
        </SettingsSectionCard>
      ) : null}

      <SettingsSectionCard
        plain
        title="ملخص الأسئلة"
        description="توزيع الإجابات لكل حقل في النموذج"
      >
        <div className="flex flex-col gap-[12px]">
          {summary.fields.map((fieldSummary) => (
            <FieldSummaryCard
              key={fieldSummary.fieldId}
              fieldSummary={fieldSummary}
              totalSubmissions={summary.totalSubmissions}
            />
          ))}
        </div>
      </SettingsSectionCard>

      {form?.description ? (
        <p className="text-center text-[12px] text-[var(--muted-foreground)]">
          {form.title}
        </p>
      ) : null}
    </div>
  );
}
