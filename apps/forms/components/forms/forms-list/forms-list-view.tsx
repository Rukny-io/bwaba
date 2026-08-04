'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import { cn } from '@/lib/utils';

function FormsListSectionDivider({ label }: { label: string }) {
  return (
    <div
      className="col-span-full flex items-center gap-3 py-3 sm:py-4"
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
  const items =
    viewMode === 'trash'
      ? [
          {
            icon: Trash2,
            label: 'في السلة',
            value: String(listTotal),
            hint: 'تُحذف نهائياً بعد 30 يوماً',
          },
        ]
      : [
          {
            icon: FileText,
            label: 'نماذج نشطة',
            value: metrics.activeForms.value,
            hint: 'منشورة حالياً',
          },
          {
            icon: Inbox,
            label: 'الاستجابات',
            value: metrics.submissions.value,
            hint: 'إجمالي الردود',
          },
          {
            icon: LayoutTemplate,
            label: 'مخصّصة',
            value: metrics.themedForms.value,
            hint: 'بتصميم مخصص',
          },
          {
            icon: BarChart2,
            label: 'معدل الإكمال',
            value: metrics.completionRate.value,
            hint: 'عبر نماذجك',
          },
        ];

  return (
    <div
      className={cn(
        'grid gap-3',
        items.length === 1
          ? 'grid-cols-1'
          : 'grid-cols-2 xl:grid-cols-4',
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <DashboardSurface
            key={item.label}
            padding="sm"
            className="flex items-center gap-3"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)]">
              <Icon size={16} strokeWidth={1.7} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[var(--muted-foreground)]">
                {item.label}
              </p>
              <p
                className="text-base font-bold tabular-nums text-[var(--foreground)] sm:text-lg"
                dir="ltr"
                lang="en"
              >
                {item.value}
              </p>
              <p className="truncate text-[10px] text-[var(--muted-foreground)]/80">
                {item.hint}
                {sharedCount > 0 && item.label === 'نماذج نشطة'
                  ? ` · ${sharedCount} مشترك`
                  : ''}
              </p>
            </div>
          </DashboardSurface>
        );
      })}
    </div>
  );
}

export function FormsListView({
  metrics,
}: {
  metrics: FormsDashboardMetrics;
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<FormsListViewMode>('active');
  const [statusFilter, setStatusFilter] = useState<'' | FormStatus>('');
  const [page, setPage] = useState(1);
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [pagination, setPagination] = useState<FormsPagination>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FormListItem | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<FormListItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listForms({
        page,
        limit: 20,
        visibility: viewMode === 'trash' ? 'deleted' : 'active',
        ...(viewMode === 'active' && statusFilter
          ? { status: statusFilter }
          : {}),
      });
      setForms(res.forms);
      setPagination(res.pagination);
    } catch (e) {
      setError(
        e instanceof ApiException ? e.message : 'تعذّر تحميل النماذج',
      );
      setForms([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, viewMode]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, viewMode]);

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
      appToast.success(
        `تم نقل النموذج إلى سلة المحذوفات (${result.retentionDays} يوماً)`,
      );
      await load();
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
      appToast.success('تم استعادة النموذج');
      await load();
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-[13px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
            >
              <Plus size={15} strokeWidth={2.2} />
              إنشاء نموذج
            </Link>
          ) : null
        }
      />

      <FormsListSummary
        metrics={metrics}
        listTotal={pagination.total}
        sharedCount={sharedForms.length}
        viewMode={viewMode}
      />

      <DashboardSurface padding="sm" className="sm:px-4 sm:py-3">
        <FormsListToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          status={statusFilter}
          onStatusChange={setStatusFilter}
        />
      </DashboardSurface>

      {error ? (
        <DashboardErrorState
          variant="inline"
          message={error}
          onRetry={() => void load()}
        />
      ) : null}

      {loading ? (
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
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
                  isDisabled={page <= 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                >
                  السابق
                </Button>
                <span className="flex items-center text-xs text-[var(--muted-foreground)]">
                  {page} / {pagination.pages ?? 1}
                </span>
                <Button
                  variant="tertiary"
                  size="sm"
                  isDisabled={page >= (pagination.pages ?? 1)}
                  onPress={() => setPage((p) => p + 1)}
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
