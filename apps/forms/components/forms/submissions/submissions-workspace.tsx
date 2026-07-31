'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@heroui/react';
import { ApiException } from '@/lib/api-client';
import {
  deleteSubmission,
  exportSubmissionsCsv,
  getForm,
  getSubmissionsSummary,
  listSubmissions,
  type FormDetail,
  type FormSubmission,
  type SubmissionsSummaryResponse,
} from '@/lib/forms-api';
import {
  getPermissionDeniedCopy,
  hasFormTeamPermission,
  resolveFormAccessRole,
} from '@/lib/form-team-permissions';
import { collectRespondentEmails } from '@/lib/submission-utils';
import { appToast } from '@/lib/app-toast';
import { FormPermissionDeniedState } from '@/components/forms/shared/form-permission-denied-state';
import { DashboardErrorState } from '@/components/app/dashboard-error-state';
import { SubmissionsTabBar, useSubmissionsTab } from '@/components/forms/submissions/submissions-tab-bar';
import { SubmissionsSummaryTab } from '@/components/forms/submissions/submissions-summary-tab';
import { SubmissionsQuestionTab } from '@/components/forms/submissions/submissions-question-tab';
import { SubmissionsIndividualTab } from '@/components/forms/submissions/submissions-individual-tab';
import { SubmissionsSearchBar } from '@/components/forms/submissions/submissions-search-bar';

const PAGE_SIZE = 50;

function SubmissionsWorkspaceInner({ formId }: { formId: string }) {
  const tab = useSubmissionsTab();

  const [form, setForm] = useState<FormDetail | null>(null);
  const [summary, setSummary] = useState<SubmissionsSummaryResponse | null>(
    null,
  );
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMoreCursor, setHasMoreCursor] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accessRole = useMemo(
    () => (form ? resolveFormAccessRole(form) : 'OWNER'),
    [form],
  );
  const canViewSubmissions = hasFormTeamPermission(accessRole, 'view_submissions');
  const canExportSubmissions = hasFormTeamPermission(
    accessRole,
    'export_submissions',
  );
  const permissionDeniedCopy = getPermissionDeniedCopy(
    'view_submissions',
    accessRole,
  );

  const loadSubmissions = useCallback(
    async (search?: string) => {
      if (search?.trim()) {
        return listSubmissions(formId, {
          limit: PAGE_SIZE,
          search: search.trim(),
        });
      }
      return listSubmissions(formId, { page: 1, limit: PAGE_SIZE });
    },
    [formId],
  );

  const loadCore = useCallback(
    async (search = '') => {
      setLoading(true);
      setError(null);
      try {
        const formData = await getForm(formId);
        setForm(formData);

        const role = resolveFormAccessRole(formData);
        if (!hasFormTeamPermission(role, 'view_submissions')) {
          setSummary(null);
          setSubmissions([]);
          setTotalSubmissions(0);
          return;
        }

        const [summaryData, listData] = await Promise.all([
          getSubmissionsSummary(formId),
          loadSubmissions(search),
        ]);
        setSummary(summaryData);
        setSubmissions(listData.submissions);
        setTotalSubmissions(listData.pagination.total);
        setPage(1);
        setPages(listData.pagination.pages ?? 1);
        setNextCursor(listData.pagination.nextCursor ?? null);
        setHasMoreCursor(Boolean(listData.pagination.hasMore));
      } catch (e) {
        if (e instanceof ApiException && e.statusCode === 403) {
          setError(e.message);
        } else {
          setError(
            e instanceof ApiException ? e.message : 'تعذّر تحميل الاستجابات',
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [formId, loadSubmissions],
  );

  useEffect(() => {
    void loadCore('');
  }, [formId, loadCore]);

  async function loadMoreSubmissions() {
    if (loadingMore || !canViewSubmissions) return;
    if (activeSearch) {
      if (!hasMoreCursor || !nextCursor) return;
      setLoadingMore(true);
      try {
        const res = await listSubmissions(formId, {
          limit: PAGE_SIZE,
          search: activeSearch,
          cursor: nextCursor,
        });
        setSubmissions((prev) => [...prev, ...res.submissions]);
        setNextCursor(res.pagination.nextCursor ?? null);
        setHasMoreCursor(Boolean(res.pagination.hasMore));
      } catch (e) {
        setError(
          e instanceof ApiException ? e.message : 'تعذّر تحميل المزيد',
        );
      } finally {
        setLoadingMore(false);
      }
      return;
    }

    if (page >= pages) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await listSubmissions(formId, {
        page: nextPage,
        limit: PAGE_SIZE,
      });
      setSubmissions((prev) => [...prev, ...res.submissions]);
      setPage(nextPage);
      setPages(res.pagination.pages ?? pages);
    } catch (e) {
      setError(
        e instanceof ApiException ? e.message : 'تعذّر تحميل المزيد',
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function runSearch() {
    if (!canViewSubmissions) return;
    const query = searchInput.trim();
    setSearching(true);
    setError(null);
    setActiveSearch(query);
    try {
      const listData = await loadSubmissions(query);
      setSubmissions(listData.submissions);
      setTotalSubmissions(listData.pagination.total);
      setPage(1);
      setPages(listData.pagination.pages ?? 1);
      setNextCursor(listData.pagination.nextCursor ?? null);
      setHasMoreCursor(Boolean(listData.pagination.hasMore));
    } catch (e) {
      setError(e instanceof ApiException ? e.message : 'تعذّر البحث');
    } finally {
      setSearching(false);
    }
  }

  async function handleExport() {
    if (!canExportSubmissions) return;
    setExporting(true);
    setError(null);
    try {
      await exportSubmissionsCsv(formId);
      appToast.success('تم تصدير الاستجابات', {
        description: 'تحقق من ملف CSV في مجلد التنزيلات',
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'تعذّر التصدير';
      setError(message);
      appToast.error(message);
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete(sub: FormSubmission) {
    setBusyId(sub.id);
    setError(null);
    try {
      await deleteSubmission(formId, sub.id);
      setSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
      setTotalSubmissions((t) => Math.max(0, t - 1));
      const summaryData = await getSubmissionsSummary(formId);
      setSummary(summaryData);
      appToast.success('تم حذف الاستجابة');
    } catch (e) {
      const message = e instanceof ApiException ? e.message : 'تعذّر الحذف';
      setError(message);
      appToast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  const respondentEmails = collectRespondentEmails(submissions);
  const displayTotal = summary?.totalSubmissions ?? totalSubmissions;

  if (loading && !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (form && !canViewSubmissions) {
    return (
      <FormPermissionDeniedState
        title={permissionDeniedCopy.title}
        description={permissionDeniedCopy.description}
        actionHref={`/app/forms/${formId}`}
        actionLabel="العودة لإعدادات النموذج"
      />
    );
  }

  return (
    <div className="dashboard-section-stack">
      <SubmissionsTabBar
        total={displayTotal}
        exporting={exporting}
        canExport={canExportSubmissions}
        onExport={() => void handleExport()}
      />

      <SubmissionsSearchBar
        value={searchInput}
        onChange={(value) => {
          setSearchInput(value);
          if (!value.trim() && activeSearch) {
            setActiveSearch('');
            void loadCore('');
          }
        }}
        onSubmit={() => void runSearch()}
        busy={searching}
      />

      {activeSearch ? (
        <p className="text-[12px] text-[var(--muted-foreground)]">
          نتائج البحث عن «{activeSearch}» — {submissions.length} من{' '}
          {totalSubmissions}
        </p>
      ) : null}

      {error ? (
        <DashboardErrorState
          variant="inline"
          message={error}
          onRetry={() => void loadCore(activeSearch)}
        />
      ) : null}

      {tab === 'summary' ? (
        <SubmissionsSummaryTab
          form={form}
          summary={summary}
          respondentEmails={respondentEmails}
          loading={loading}
        />
      ) : null}

      {tab === 'question' && form ? (
        <SubmissionsQuestionTab
          fields={form.fields ?? []}
          submissions={submissions}
          totalSubmissions={displayTotal}
        />
      ) : null}

      {tab === 'individual' && form ? (
        <SubmissionsIndividualTab
          form={form}
          submissions={submissions}
          totalSubmissions={displayTotal}
          busyId={busyId}
          onDelete={(sub) => void handleDelete(sub)}
          hasMore={activeSearch ? hasMoreCursor : page < pages}
          loadingMore={loadingMore}
          onLoadMore={() => void loadMoreSubmissions()}
        />
      ) : null}
    </div>
  );
}

export function SubmissionsWorkspace({ formId }: { formId: string }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      }
    >
      <SubmissionsWorkspaceInner formId={formId} />
    </Suspense>
  );
}
