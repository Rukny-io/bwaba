'use client';

import { useMemo, useState } from 'react';
import { AlertDialog, Button, Chip } from '@heroui/react';
import type { FormDetail, FormSubmission } from '@/lib/forms-api';
import {
  getSubmissionFieldValue,
  sortedInputFields,
} from '@/lib/submission-utils';
import { SubmissionAnswerDisplay } from '@/components/forms/submissions/submission-answer-display';
import { DashboardEmptyState } from '@/components/app/dashboard-empty-state';
import { formDetailCardClass } from '@/lib/form-detail-styles';
import { cn } from '@/lib/utils';
import {
  PagerIconActions,
  SubmissionPagerToolbar,
} from '@/components/forms/submissions/submission-pager-toolbar';

interface SubmissionsIndividualTabProps {
  form: FormDetail;
  submissions: FormSubmission[];
  totalSubmissions: number;
  busyId: string | null;
  onDelete: (submission: FormSubmission) => void;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function SubmissionsIndividualTab({
  form,
  submissions,
  totalSubmissions,
  busyId,
  onDelete,
  loadingMore,
  onLoadMore,
  hasMore,
}: SubmissionsIndividualTabProps) {
  const [index, setIndex] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<FormSubmission | null>(null);

  const inputFields = useMemo(
    () => sortedInputFields(form.fields ?? []),
    [form.fields],
  );

  const pagerOptions = useMemo(
    () =>
      submissions.map((_, i) => ({
        id: String(i),
        label: `استجابة ${i + 1}`,
      })),
    [submissions],
  );

  if (totalSubmissions === 0 || submissions.length === 0) {
    return (
      <DashboardEmptyState compact title="لا توجد استجابات بعد" />
    );
  }

  const safeIndex = Math.min(index, submissions.length - 1);
  const submission = submissions[safeIndex];

  return (
    <div className="flex flex-col gap-[12px] print:space-y-2">
      <SubmissionPagerToolbar
        selectLabel="الاستجابة"
        options={pagerOptions}
        selectedKey={String(safeIndex)}
        onSelectionChange={(key) => setIndex(Number(key))}
        page={safeIndex + 1}
        total={totalSubmissions}
        canPrevious={safeIndex > 0}
        canNext={safeIndex < submissions.length - 1}
        onPrevious={() => setIndex((i) => Math.max(0, i - 1))}
        onNext={() =>
          setIndex((i) => Math.min(submissions.length - 1, i + 1))
        }
        previousAriaLabel="الاستجابة السابقة"
        nextAriaLabel="الاستجابة التالية"
        actions={
          <PagerIconActions
            onPrint={() => window.print()}
            onDelete={() => setDeleteTarget(submission)}
            deleteBusy={busyId === submission.id}
          />
        }
      />

      {hasMore && onLoadMore ? (
        <div className="flex justify-center print:hidden">
          <Button
            variant="tertiary"
            size="sm"
            isDisabled={loadingMore}
            onPress={onLoadMore}
            className="rounded-xl"
          >
            {loadingMore ? 'جاري التحميل…' : 'تحميل المزيد من الاستجابات'}
          </Button>
        </div>
      ) : null}

      {submission.user?.email ? (
        <div className="flex flex-wrap gap-2 print:hidden">
          <Chip
            size="sm"
            className="bg-[var(--surface-secondary)] font-normal text-[var(--foreground)]"
          >
            <span dir="ltr">{submission.user.email}</span>
          </Chip>
        </div>
      ) : null}

      <div className="flex flex-col gap-[12px] print:space-y-2">
        {inputFields.map((field, i) => {
          const value = getSubmissionFieldValue(submission.data, field);

          return (
            <article
              key={field.id}
              className={cn(
                formDetailCardClass,
                'print:border-none print:shadow-none',
              )}
            >
              <p className="text-[14px] font-semibold text-[var(--foreground)]">
                {i + 1}. {field.label}
                {field.required ? (
                  <span className="ms-1 text-[var(--danger)]">*</span>
                ) : null}
              </p>
              {field.description ? (
                <p className="text-[12px] leading-relaxed text-[var(--muted-foreground)]">
                  {field.description}
                </p>
              ) : null}
              <SubmissionAnswerDisplay field={field} value={value} compact />
            </article>
          );
        })}
      </div>

      <AlertDialog.Backdrop
        isOpen={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        isDismissable
      >
        <AlertDialog.Container size="md">
          <AlertDialog.Dialog>
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Heading>حذف هذه الاستجابة؟</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm text-[var(--muted-foreground)]">
                لا يمكن التراجع عن هذا الإجراء.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="tertiary" onPress={() => setDeleteTarget(null)}>
                إلغاء
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  if (deleteTarget) {
                    onDelete(deleteTarget);
                    setDeleteTarget(null);
                    if (index >= submissions.length - 1 && index > 0) {
                      setIndex((i) => i - 1);
                    }
                  }
                }}
              >
                حذف
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </div>
  );
}
