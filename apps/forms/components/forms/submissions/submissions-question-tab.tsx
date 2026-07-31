'use client';

import { useMemo, useState } from 'react';
import type { FormField, FormSubmission } from '@/lib/forms-api';
import {
  formatSubmissionValue,
  getSubmissionFieldValue,
  isBlankSubmissionValue,
  isChoiceFieldType,
  isNumericFieldType,
  isSignatureSubmissionValue,
  sortedInputFields,
} from '@/lib/submission-utils';
import { DashboardEmptyState } from '@/components/app/dashboard-empty-state';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import {
  getChoiceLabel,
  GroupedAnswerRow,
  SignatureGallery,
  TextResponseList,
  DistributionBars,
} from '@/components/forms/submissions/submission-answer-display';
import { SubmissionPagerToolbar } from '@/components/forms/submissions/submission-pager-toolbar';

interface SubmissionsQuestionTabProps {
  fields: FormField[];
  submissions: FormSubmission[];
  totalSubmissions: number;
}

function groupFieldAnswers(
  field: FormField,
  submissions: FormSubmission[],
): { label: string; count: number; values: string[] }[] {
  const groups = new Map<string, { count: number; values: string[] }>();
  let blankCount = 0;

  for (const sub of submissions) {
    const raw = getSubmissionFieldValue(sub.data, field);
    if (isBlankSubmissionValue(raw)) {
      blankCount += 1;
      continue;
    }

    if (field.type === 'SIGNATURE') {
      if (isSignatureSubmissionValue(raw)) {
        const existing = groups.get('توقيع') ?? { count: 0, values: [] };
        existing.count += 1;
        groups.set('توقيع', existing);
      } else {
        blankCount += 1;
      }
      continue;
    }

    if (field.type === 'TOGGLE' || field.type === 'CHECKBOX') {
      const display =
        raw === true || raw === 'true' || raw === 'نعم' ? 'نعم' : 'لا';
      const existing = groups.get(display) ?? { count: 0, values: [] };
      existing.count += 1;
      groups.set(display, existing);
      continue;
    }

    if (field.type === 'MULTISELECT') {
      const items = Array.isArray(raw) ? raw.map(String) : [String(raw)];
      for (const item of items) {
        const key = isChoiceFieldType(field.type)
          ? getChoiceLabel(field, item)
          : item;
        const existing = groups.get(key) ?? { count: 0, values: [] };
        existing.count += 1;
        existing.values.push(item);
        groups.set(key, existing);
      }
      continue;
    }

    const display = isChoiceFieldType(field.type)
      ? getChoiceLabel(field, String(raw))
      : formatSubmissionValue(raw);

    const existing = groups.get(display) ?? { count: 0, values: [] };
    existing.count += 1;
    existing.values.push(display);
    groups.set(display, existing);
  }

  const rows: { label: string; count: number; values: string[] }[] = [];

  if (blankCount > 0) {
    rows.push({
      label: 'ترك الحقل فارغاً',
      count: blankCount,
      values: [],
    });
  }

  for (const [label, data] of groups.entries()) {
    rows.push({ label, count: data.count, values: data.values });
  }

  rows.sort((a, b) => b.count - a.count);
  return rows;
}

export function SubmissionsQuestionTab({
  fields,
  submissions,
  totalSubmissions,
}: SubmissionsQuestionTabProps) {
  const inputFields = useMemo(() => sortedInputFields(fields), [fields]);
  const [fieldIndex, setFieldIndex] = useState(0);
  const pagerOptions = useMemo(
    () =>
      inputFields.map((f, i) => ({
        id: String(i),
        label: `${i + 1}. ${f.label}`,
      })),
    [inputFields],
  );

  if (totalSubmissions === 0 || inputFields.length === 0) {
    return (
      <DashboardEmptyState
        compact
        title={
          inputFields.length === 0
            ? 'لا توجد أسئلة في هذا النموذج'
            : 'لا توجد استجابات بعد'
        }
      />
    );
  }

  const safeIndex = Math.min(fieldIndex, inputFields.length - 1);
  const field = inputFields[safeIndex];
  const groups = groupFieldAnswers(field, submissions);
  const textAnswers = submissions
    .map((sub) => getSubmissionFieldValue(sub.data, field))
    .filter((v) => !isBlankSubmissionValue(v))
    .map((v) => formatSubmissionValue(v))
    .filter(Boolean);

  const signatureAnswers = submissions
    .map((sub) => getSubmissionFieldValue(sub.data, field))
    .filter((v) => isSignatureSubmissionValue(v));

  const distribution = groups
    .filter((g) => g.label !== 'ترك الحقل فارغاً')
    .map((g) => ({
      name: g.label,
      count: g.count,
      percentage:
        totalSubmissions > 0
          ? Math.round((g.count / totalSubmissions) * 100)
          : 0,
    }));

  return (
    <div className="space-y-4">
      <SubmissionPagerToolbar
        selectLabel="السؤال"
        selectClassName="w-full min-w-[12rem] max-w-md sm:max-w-lg"
        options={pagerOptions}
        selectedKey={String(safeIndex)}
        onSelectionChange={(key) => setFieldIndex(Number(key))}
        page={safeIndex + 1}
        total={inputFields.length}
        canPrevious={safeIndex > 0}
        canNext={safeIndex < inputFields.length - 1}
        onPrevious={() => setFieldIndex((i) => Math.max(0, i - 1))}
        onNext={() =>
          setFieldIndex((i) => Math.min(inputFields.length - 1, i + 1))
        }
        previousAriaLabel="السؤال السابق"
        nextAriaLabel="السؤال التالي"
      />

      <DashboardSurface as="article">
        <h3 className="mb-1 text-base font-semibold text-[var(--foreground)]">
          {field.label}
        </h3>
        {field.description ? (
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            {field.description}
          </p>
        ) : (
          <div className="mb-4" />
        )}

        {isChoiceFieldType(field.type) || field.type === 'TOGGLE' ? (
          <div className="space-y-2">
            {groups.map((group) => (
              <GroupedAnswerRow
                key={group.label}
                label={group.label}
                count={group.count}
              />
            ))}
            {distribution.length > 1 ? (
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <DistributionBars
                  items={distribution}
                  total={totalSubmissions}
                />
              </div>
            ) : null}
          </div>
        ) : isNumericFieldType(field.type) && distribution.length > 0 ? (
          <DistributionBars items={distribution} total={totalSubmissions} />
        ) : field.type === 'SIGNATURE' ? (
          <SignatureGallery values={signatureAnswers} />
        ) : (
          <TextResponseList responses={textAnswers} />
        )}
      </DashboardSurface>
    </div>
  );
}
