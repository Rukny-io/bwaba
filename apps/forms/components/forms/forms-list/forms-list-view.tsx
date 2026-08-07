'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@heroui/react';
import {
  BarChart2,
  FileText,
  Inbox,
  LayoutTemplate,
  Plus,
  Trash2,
} from 'lucide-react';
import { ApiException } from '@/lib/api-client';
import { appToast } from '@/lib/app-toast';
import {
  deleteForm,
  duplicateForm,
  listForms,
  restoreForm,
  type FormListItem,
  type FormsPagination,
  type FormStatus,
} from '@/lib/forms-api';
import type { FormsDashboardMetrics } from '@/lib/forms-dashboard-data';
import { getDefaultFormWorkspacePath } from '@/lib/form-team-permissions';
import { FORMS_CREATE_ENTRY_PATH } from '@/lib/forms-paths';
import {
  FormCard,
  FormsGridSkeleton,
} from '@/components/forms/forms-list/form-card';
import {
  FormDeleteDialog,
  FormRestoreDialog,
} from '@/components/forms/forms-list/form-delete-dialog';
import {
  FormsListToolbar,
  type FormsListViewMode,
} from '@/components/forms/forms-list/forms-list-toolbar';
import { DashboardErrorState } from '@/components/app/dashboard-error-state';
import { DashboardEmptyState } from '@/components/app/dashboard-empty-state';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import { cn } from '@/lib/utils';

type ListCacheEntry = {
  forms: FormListItem[];
  pagination: FormsPagination;
};

const EMPTY_PAGINATION: FormsPagination = {
  total: 0,
  page: 1,
  limit: 20,
  pages: 1,
};

const PREFETCH_STATUSES: Array<'' | FormStatus> = [
  '',
  'DRAFT',
  'PUBLISHED',
  'CLOSED',
  'ARCHIVED',
];

function listCacheKey(
  viewMode: FormsListViewMode,
  status: '' | FormStatus,
  page: number,
) {
  return `${viewMode}:${status || 'all'}:${page}`;
}

function FormsListSectionDivider({ label }: { label: string }) {
  return (
    <div
      className="col-span-full flex items-center gap-3 py-2 sm:py-4"
      role="separator"
      aria-label={label}
    >
      <div className="h-px flex-1 bg-[var(--separator)]" />
      <span className="shrink-0 text-xs font-medium text-[var(--muted-foreground)]">
        {label}
      </span>
      <div className="h-px flex-1 bg-[var(--separator)]" />
    </div>
  );
}

function FormsListSummary({
  metrics,
  listTotal,
  sharedCount,
  viewMode,
}: {
  metrics: FormsDashboardMetrics;
  listTotal: number;
  sharedCount: number;
  viewMode: FormsListViewMode;
}) {
  if (viewMode === 'trash') {
    return (
      <div className="grid auto-rows-fr grid-cols-1 gap-2.5 sm:gap-3">
        <DashboardMetricCard
          icon={Trash2}
          label="في السلة"
          value={String(listTotal)}
          comparisonPrimary="نماذج محذوفة"
          comparisonSecondary="تُحذف نهائياً بعد 30 يوماً"
        />
      </div>
    );
  }

  const activeComparisonPrimary =
    sharedCount > 0
      ? `منشورة · ${sharedCount} مشترك`
      : 'نماذج منشورة';

  return (
    <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
      <DashboardMetricCard
        icon={FileText}
        label="النماذج النشطة"
        value={metrics.activeForms.value}
        trend={metrics.activeForms.trend}
        trendPositive={metrics.activeForms.trendPositive}
        comparisonPrimary={activeComparisonPrimary}
        comparisonSecondary="مقابل الشهر الماضي"
      />
      <DashboardMetricCard
        icon={Inbox}
        label="إجمالي الاستجابات"
        value={metrics.submissions.value}
        trend={metrics.submissions.trend}
        trendPositive={metrics.submissions.trendPositive}
        comparisonPrimary="استجابات"
        comparisonSecondary="مقابل الشهر الماضي"
      />
      <DashboardMetricCard
        icon={LayoutTemplate}
        label="نماذج مخصّصة"
        value={metrics.themedForms.value}
        trend={metrics.themedForms.trend}
        trendPositive={metrics.themedForms.trendPositive}
        comparisonPrimary="بتصميم مخصص"
        comparisonSecondary="من إجمالي نماذجك"
      />
      <DashboardMetricCard
        icon={BarChart2}
        label="معدل الإكمال"
        value={metrics.completionRate.value}
        trend={metrics.completionRate.trend}
        trendPositive={metrics.completionRate.trendPositive}
        comparisonPrimary="إكمال"
        comparisonSecondary="مقابل الشهر الماضي"
      />
    </div>
  );
}

export function FormsListView({
  metrics,
}: {
  metrics: FormsDashboardMetrics;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const cacheRef = useRef(new Map<string, ListCacheEntry>());
  const requestSeqRef = useRef(0);
  const prefetchDoneRef = useRef(false);

  const [viewMode, setViewMode] = useState<FormsListViewMode>('active');
  const [statusFilter, setStatusFilter] = useState<'' | FormStatus>('');
  const [page, setPage] = useState(1);
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [pagination, setPagination] =
    useState<FormsPagination>(EMPTY_PAGINATION);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FormListItem | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<FormListItem | null>(null);

  const applyCacheEntry = useCallback((entry: ListCacheEntry) => {
    setForms(entry.forms);
    setPagination(entry.pagination);
    setError(null);
    setInitialLoading(false);
  }, []);

  const fetchList = useCallback(
    async (
      nextView: FormsListViewMode,
      nextStatus: '' | FormStatus,
      nextPage: number,
      opts?: { soft?: boolean },
    ) => {
      const key = listCacheKey(nextView, nextStatus, nextPage);
      const seq = ++requestSeqRef.current;
      const soft = opts?.soft ?? false;

      if (soft) setRefreshing(true);
      else setInitialLoading(true);
      setError(null);

      try {
        const res = await listForms({
          page: nextPage,
          limit: 20,
          visibility: nextView === 'trash' ? 'deleted' : 'active',
          ...(nextView === 'active' && nextStatus
            ? { status: nextStatus }
            : {}),
        });

        if (seq !== requestSeqRef.current) return;

        const entry: ListCacheEntry = {
          forms: res.forms,
          pagination: res.pagination,
        };
        cacheRef.current.set(key, entry);
        applyCacheEntry(entry);
      } catch (e) {
        if (seq !== requestSeqRef.current) return;
        setError(
          e instanceof ApiException ? e.message : 'تعذّر تحميل النماذج',
        );
        if (!soft) {
          setForms([]);
          setPagination(EMPTY_PAGINATION);
        }
      } finally {
        if (seq === requestSeqRef.current) {
          setInitialLoading(false);
          setRefreshing(false);
        }
      }
    },
    [applyCacheEntry],
  );

  const selectList = useCallback(
    (
      nextView: FormsListViewMode,
      nextStatus: '' | FormStatus,
      nextPage: number,
    ) => {
      const key = listCacheKey(nextView, nextStatus, nextPage);
      const cached = cacheRef.current.get(key);

      if (cached) {
        applyCacheEntry(cached);
        void fetchList(nextView, nextStatus, nextPage, { soft: true });
        return;
      }

      setForms([]);
      setPagination(EMPTY_PAGINATION);
      void fetchList(nextView, nextStatus, nextPage, { soft: false });
    },
    [applyCacheEntry, fetchList],
  );

  useEffect(() => {
    selectList('active', '', 1);
    // initial mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Prefetch other tabs so first click feels instant */
  useEffect(() => {
    if (initialLoading || prefetchDoneRef.current) return;
    prefetchDoneRef.current = true;

    const run = () => {
      void listForms({
        page: 1,
        limit: 20,
        visibility: 'deleted',
      }).then((res) => {
        cacheRef.current.set(listCacheKey('trash', '', 1), {
          forms: res.forms,
          pagination: res.pagination,
        });
      });

      for (const status of PREFETCH_STATUSES) {
        if (status === '') continue;
        const key = listCacheKey('active', status, 1);
        if (cacheRef.current.has(key)) continue;
        void listForms({
          page: 1,
          limit: 20,
          visibility: 'active',
          status,
        }).then((res) => {
          cacheRef.current.set(key, {
            forms: res.forms,
            pagination: res.pagination,
          });
        });
      }
    };

    const win = window as Window & {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (win.requestIdleCallback) {
      const id = win.requestIdleCallback(run, { timeout: 1500 });
      return () => win.cancelIdleCallback?.(id);
    }

    const t = window.setTimeout(run, 400);
    return () => window.clearTimeout(t);
  }, [initialLoading]);

  function invalidateListCache() {
    cacheRef.current.clear();
    prefetchDoneRef.current = false;
  }

  function handleViewModeChange(mode: FormsListViewMode) {
    startTransition(() => {
      setViewMode(mode);
      setStatusFilter('');
      setPage(1);
      selectList(mode, '', 1);
    });
  }

  function handleStatusChange(status: '' | FormStatus) {
    startTransition(() => {
      setStatusFilter(status);
      setPage(1);
      selectList(viewMode, status, 1);
    });
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    selectList(viewMode, statusFilter, nextPage);
  }

  const ownForms = useMemo(
    () => forms.filter((form) => !form.isShared),
    [forms],
  );
  const sharedForms = useMemo(
    () => forms.filter((form) => form.isShared),
    [forms],
  );

  function openFormWorkspace(form: FormListItem) {
    const accessRole = (
      form.isShared ? (form.sharedWorkspace?.role ?? 'VIEWER') : 'OWNER'
    ) as 'OWNER' | 'EDITOR' | 'VIEWER' | 'ANALYST';
    router.push(getDefaultFormWorkspacePath(form.id, accessRole));
  }

  function renderFormCard(form: FormListItem) {
    return (
      <FormCard
        key={form.id}
        form={form}
        busy={busyId === form.id}
        isTrash={viewMode === 'trash'}
        onView={openFormWorkspace}
        onEdit={openFormWorkspace}
        onDuplicate={(f) => void handleDuplicate(f)}
        onDelete={setDeleteTarget}
        onRestore={setRestoreTarget}
      />
    );
  }

  async function handleDuplicate(form: FormListItem) {
    setBusyId(form.id);
    try {
      const copy = await duplicateForm(form.id);
      invalidateListCache();
      appToast.success('تم نسخ النموذج');
      router.push(`/app/forms/${copy.id}`);
    } catch (e) {
      appToast.fromError(e, 'تعذّر نسخ النموذج');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete(payload: {
    confirmTitle: string;
    reason?: string;
  }) {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const result = await deleteForm(deleteTarget.id, payload);
      setDeleteTarget(null);
      invalidateListCache();
      appToast.success(
        `تم نقل النموذج إلى سلة المحذوفات (${result.retentionDays} يوماً)`,
      );
      await fetchList(viewMode, statusFilter, page, { soft: false });
    } catch (e) {
      appToast.fromError(e, 'تعذّر حذف النموذج');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmRestore(confirmTitle: string) {
    if (!restoreTarget) return;
    setBusyId(restoreTarget.id);
    try {
      await restoreForm(restoreTarget.id, confirmTitle);
      setRestoreTarget(null);
      invalidateListCache();
      appToast.success('تم استعادة النموذج');
      await fetchList(viewMode, statusFilter, page, { soft: false });
    } catch (e) {
      appToast.fromError(e, 'تعذّر استعادة النموذج');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <DashboardPageHeader
        title="نماذجي"
        description={
          viewMode === 'trash'
            ? 'النماذج المحذوفة تبقى 30 يوماً قبل الحذف النهائي.'
            : sharedForms.length > 0
              ? `إدارة نماذجك ونشرها · ${sharedForms.length} نموذج مشترك معك عبر الفريق.`
              : 'إنشاء وإدارة نماذجك ونشرها للجمهور.'
        }
        actions={
          viewMode === 'active' ? (
            <Link
              href={FORMS_CREATE_ENTRY_PATH}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2.5 text-[13px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 sm:w-auto sm:px-3.5 sm:py-2"
            >
              <Plus size={15} strokeWidth={2.2} />
              إنشاء نموذج
            </Link>
          ) : null
        }
        className="mb-0 [&_h1]:text-xl sm:[&_h1]:text-2xl"
      />

      <FormsListSummary
        metrics={metrics}
        listTotal={pagination.total}
        sharedCount={sharedForms.length}
        viewMode={viewMode}
      />

      <FormsListToolbar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        status={statusFilter}
        onStatusChange={handleStatusChange}
        activeCount={viewMode === 'active' ? pagination.total : undefined}
        trashCount={viewMode === 'trash' ? pagination.total : undefined}
        filterCount={
          viewMode === 'active' && statusFilter ? pagination.total : undefined
        }
      />

      {error ? (
        <DashboardErrorState
          variant="inline"
          message={error}
          onRetry={() =>
            void fetchList(viewMode, statusFilter, page, { soft: false })
          }
        />
      ) : null}

      {initialLoading ? (
        <FormsGridSkeleton count={8} />
      ) : forms.length === 0 ? (
        <DashboardEmptyState
          icon={viewMode === 'trash' ? Trash2 : FileText}
          title={
            viewMode === 'trash'
              ? 'سلة المحذوفات فارغة'
              : statusFilter
                ? 'لا توجد نماذج بهذه الحالة'
                : 'لا توجد نماذج بعد'
          }
          description={
            viewMode === 'trash'
              ? 'النماذج المحذوفة تبقى 30 يوماً قبل الحذف النهائي.'
              : 'أنشئ أول نموذج لك لجمع الاستجابات، أو ابدأ من قالب جاهز.'
          }
        >
          {viewMode === 'active' ? (
            <>
              <Link
                href={FORMS_CREATE_ENTRY_PATH}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-[13px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
              >
                <Plus size={15} strokeWidth={2.2} />
                إنشاء نموذج
              </Link>
              <Link
                href="/app/templates"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-[13px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
              >
                تصفح القوالب
              </Link>
            </>
          ) : null}
        </DashboardEmptyState>
      ) : (
        <>
          <div
            className={cn(
              'grid grid-cols-2 gap-3 transition-opacity duration-150 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4',
              refreshing && 'opacity-60',
            )}
            aria-busy={refreshing || undefined}
          >
            <AnimatePresence mode="popLayout">
              {ownForms.map((form) => renderFormCard(form))}
              {ownForms.length > 0 && sharedForms.length > 0 ? (
                <FormsListSectionDivider label="نماذج مشتركة معك عبر الفريق" />
              ) : null}
              {sharedForms.map((form) => renderFormCard(form))}
            </AnimatePresence>
          </div>

          {(pagination.pages ?? 1) > 1 && (
            <DashboardSurface
              padding="sm"
              className="flex items-center justify-between"
            >
              <span className="text-xs text-[var(--muted-foreground)]">
                {pagination.total} نموذج
              </span>
              <div className="flex gap-2">
                <Button
                  variant="tertiary"
                  size="sm"
                  isDisabled={page <= 1 || refreshing}
                  onPress={() => handlePageChange(Math.max(1, page - 1))}
                >
                  السابق
                </Button>
                <span className="flex items-center text-xs text-[var(--muted-foreground)]">
                  {page} / {pagination.pages ?? 1}
                </span>
                <Button
                  variant="tertiary"
                  size="sm"
                  isDisabled={page >= (pagination.pages ?? 1) || refreshing}
                  onPress={() => handlePageChange(page + 1)}
                >
                  التالي
                </Button>
              </div>
            </DashboardSurface>
          )}
        </>
      )}

      <FormDeleteDialog
        isOpen={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        formTitle={deleteTarget?.title ?? ''}
        submissionCount={
          deleteTarget?._count?.submissions ??
          deleteTarget?.submissionCount ??
          0
        }
        busy={!!busyId}
        onConfirm={confirmDelete}
      />

      <FormRestoreDialog
        isOpen={!!restoreTarget}
        onOpenChange={(open) => {
          if (!open) setRestoreTarget(null);
        }}
        formTitle={restoreTarget?.title ?? ''}
        purgeScheduledAt={restoreTarget?.purgeScheduledAt}
        busy={!!busyId}
        onConfirm={confirmRestore}
      />
    </>
  );
}
