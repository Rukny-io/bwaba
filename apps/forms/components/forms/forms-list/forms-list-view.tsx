'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import {
  Button,
  EmptyState,
} from '@heroui/react';
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
import { getDefaultFormWorkspacePath } from '@/lib/form-team-permissions';
import { FormCard, FormsGridSkeleton } from '@/components/forms/forms-list/form-card';
import {
  FormDeleteDialog,
  FormRestoreDialog,
} from '@/components/forms/forms-list/form-delete-dialog';
import {
  FormsListToolbar,
  type FormsListViewMode,
} from '@/components/forms/forms-list/forms-list-toolbar';

function FormsListSectionDivider({ label }: { label: string }) {
  return (
    <div
      className="col-span-full flex items-center gap-3 py-3 sm:py-4"
      role="separator"
      aria-label={label}
    >
      <div className="h-px flex-1 bg-[var(--border)]" />
      <span className="shrink-0 text-xs font-medium text-[var(--muted-foreground)]">
        {label}
      </span>
      <div className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}

export function FormsListView() {
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
        ...(viewMode === 'active' && statusFilter ? { status: statusFilter } : {}),
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
    const accessRole = (form.isShared
      ? (form.sharedWorkspace?.role ?? 'VIEWER')
      : 'OWNER') as any;
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
    <section className="dashboard-page">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4 sm:mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            نماذجي
          </h1>
          <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
            إنشاء وإدارة نماذجك ونشرها للجمهور
            {sharedForms.length > 0
              ? ` · ${sharedForms.length} نموذج مشترك معك`
              : ''}
            .
          </p>
        </div>
        <Link href="/forms/n/new">
          <Button variant="primary">إنشاء نموذج</Button>
        </Link>
      </div>

      <div className="mb-4">
        <FormsListToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          status={statusFilter}
          onStatusChange={setStatusFilter}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
          <button
            type="button"
            className="ms-3 underline"
            onClick={() => void load()}
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {loading ? (
        <FormsGridSkeleton count={8} />
      ) : forms.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12">
          <EmptyState className="flex flex-col items-center gap-3 text-center">
            <p className="text-base font-semibold text-[var(--foreground)]">
              {viewMode === 'trash'
                ? 'سلة المحذوفات فارغة'
                : statusFilter
                  ? 'لا توجد نماذج بهذه الحالة'
                  : 'لا توجد نماذج بعد'}
            </p>
            <p className="max-w-sm text-sm text-[var(--muted-foreground)]">
              {viewMode === 'trash'
                ? 'النماذج المحذوفة تبقى 30 يوماً قبل الحذف النهائي.'
                : 'أنشئ أول نموذج لك لجمع الاستجابات، أو ابدأ من قالب جاهز.'}
            </p>
            {viewMode === 'active' ? (
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Link href="/forms/n/new">
                <Button variant="primary">إنشاء نموذج</Button>
              </Link>
              <Link href="/app/templates">
                <Button variant="tertiary">تصفح القوالب</Button>
              </Link>
            </div>
            ) : null}
          </EmptyState>
        </div>
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
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
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
            </div>
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
          deleteTarget?._count?.submissions ?? deleteTarget?.submissionCount ?? 0
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
    </section>
  );
}
