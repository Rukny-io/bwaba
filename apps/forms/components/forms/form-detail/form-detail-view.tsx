'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  Skeleton,
  Spinner,
} from '@heroui/react';
import { Copy, ExternalLink, Trash2 } from 'lucide-react';
import { ApiException } from '@/lib/api-client';
import { appToast } from '@/lib/app-toast';
import {
  deleteForm,
  duplicateForm,
  getForm,
  updateForm,
  updateFormStatus,
  withFormSharingMeta,
  type FormDetail,
  type FormStatus,
} from '@/lib/forms-api';
import { FormDeleteDialog } from '@/components/forms/forms-list/form-delete-dialog';
import {
  formatFormDate,
  getFormTypeLabel,
  getPublicFormUrl,
} from '@/lib/forms-format';
import { FormFieldsList } from '@/components/forms/form-detail/form-fields-list';
import { FormMultiStepPanel } from '@/components/forms/form-detail/form-multi-step-panel';
import { FormPublishSettingsPanel } from '@/components/forms/form-detail/form-publish-settings-panel';
import { FormOrphanedSubmissionsExportPanel } from '@/components/forms/form-detail/form-orphaned-submissions-export-panel';
import { fieldInputClass } from '@/components/forms/shared/form-field-input-class';
import { DashboardErrorState } from '@/components/app/dashboard-error-state';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import { cn } from '@/lib/utils';
import {
  canAccessFormWorkspaceTab,
  getDefaultFormWorkspacePath,
  resolveFormAccessRole,
} from '@/lib/form-team-permissions';

export function FormDetailView({ formId }: { formId: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getForm(formId);
      setForm(data);
      setTitle(data.title);
      setDescription(data.description ?? '');
    } catch (e) {
      setError(e instanceof ApiException ? e.message : 'تعذّر تحميل النموذج');
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!form) return;
    const role = resolveFormAccessRole(form);
    if (!canAccessFormWorkspaceTab(role, '')) {
      const target = getDefaultFormWorkspacePath(form.id, role);
      if (target !== `/app/forms/${form.id}`) {
        router.replace(target);
      }
    }
  }, [form, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateForm(form.id, {
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setForm((prev) => withFormSharingMeta(updated, prev));
      appToast.success('تم حفظ التغييرات');
    } catch (err) {
      appToast.fromError(err, 'تعذّر الحفظ');
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(status: FormStatus) {
    if (!form) return;
    setStatusBusy(true);
    try {
      const updated = await updateFormStatus(form.id, status);
      setForm((prev) => withFormSharingMeta(updated, prev));
      appToast.success(
        status === 'PUBLISHED'
          ? 'تم نشر النموذج'
          : status === 'CLOSED'
            ? 'تم إغلاق النموذج'
            : 'تم تحويل النموذج إلى مسودة',
      );
    } catch (err) {
      appToast.fromError(err, 'تعذّر تحديث الحالة');
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleDelete(payload: {
    confirmTitle: string;
    reason?: string;
  }) {
    if (!form) return;
    try {
      await deleteForm(form.id, payload);
      appToast.success('تم نقل النموذج إلى سلة المحذوفات');
      router.push('/app/forms');
    } catch (err) {
      appToast.fromError(err, 'تعذّر الحذف');
      setDeleteOpen(false);
    }
  }

  async function handleDuplicate() {
    if (!form) return;
    try {
      const copy = await duplicateForm(form.id);
      appToast.success('تم نسخ النموذج');
      router.push(`/app/forms/${copy.id}`);
    } catch (err) {
      appToast.fromError(err, 'تعذّر النسخ');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    );
  }

  if (error && !form) {
    return (
      <DashboardErrorState
        variant="inline"
        message={error}
        onRetry={() => void load()}
      />
    );
  }

  if (!form) return null;

  const submissionCount =
    form._count?.submissions ?? form.submissionCount ?? 0;
  const isShared = Boolean(form.isShared);

  return (
    <div className="dashboard-section-stack">
      <DashboardSurface
        padding="sm"
        className="bg-[var(--surface-secondary)]/40"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            {getFormTypeLabel(form.type)} · {submissionCount} استجابة ·{' '}
            {formatFormDate(form.updatedAt)}
          </p>
          <div className="flex flex-wrap gap-2">
          {form.status === 'PUBLISHED' && (
            <a
              href={getPublicFormUrl(form.slug)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="tertiary" size="sm" className="rounded-xl">
                <ExternalLink className="size-4" />
                معاينة
              </Button>
            </a>
          )}
          <Button
            variant="tertiary"
            size="sm"
            className="rounded-xl"
            onPress={() => void handleDuplicate()}
            isDisabled={isShared}
          >
            <Copy className="size-4" />
            نسخ
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            className="rounded-xl"
            onPress={() => setDeleteOpen(true)}
            isDisabled={isShared}
          >
            <Trash2 className="size-4" />
            حذف
          </Button>
        </div>
        </div>
      </DashboardSurface>

      <DashboardSurface>
        <h2 className="mb-4 text-base font-semibold text-[var(--foreground)] sm:text-lg">
          الإعدادات الأساسية
        </h2>
        <form onSubmit={(e) => void handleSave(e)} className="max-w-lg space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-title" className="text-sm font-medium">
              العنوان
            </label>
            <input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(fieldInputClass, 'px-3.5 py-2.5 text-sm')}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="edit-desc" className="text-sm font-medium">
              الوصف
            </label>
            <textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={cn(
                fieldInputClass,
                'resize-none px-3.5 py-2.5 text-sm leading-relaxed',
              )}
            />
          </div>
          <p className="text-xs text-[var(--muted-foreground)]" dir="ltr">
            /{form.slug}
          </p>
          <Button type="submit" variant="primary" isDisabled={saving}>
            {saving ? 'جاري الحفظ…' : 'حفظ التغييرات'}
          </Button>
        </form>
      </DashboardSurface>

      <FormPublishSettingsPanel
        form={form}
        onSaved={(next) => setForm((prev) => withFormSharingMeta(next, prev))}
      />

      <FormOrphanedSubmissionsExportPanel form={form} />

      <FormMultiStepPanel
        form={form}
        onSaved={(next) => setForm((prev) => withFormSharingMeta(next, prev))}
      />

      <DashboardSurface>
        <h2 className="mb-4 text-base font-semibold text-[var(--foreground)] sm:text-lg">
          الحالة والنشر
        </h2>
        <div className="flex flex-wrap gap-2">
          {(['DRAFT', 'PUBLISHED', 'CLOSED'] as FormStatus[]).map((s) => (
            <Button
              key={s}
              variant={form.status === s ? 'primary' : 'tertiary'}
              size="sm"
              isDisabled={statusBusy || form.status === s}
              onPress={() => void setStatus(s)}
            >
              {statusBusy && form.status !== s ? (
                <Spinner size="sm" />
              ) : null}
              {s === 'DRAFT' && 'مسودة'}
              {s === 'PUBLISHED' && 'نشر'}
              {s === 'CLOSED' && 'إغلاق'}
            </Button>
          ))}
        </div>
      </DashboardSurface>

      <DashboardSurface>
        <h2 className="mb-4 text-base font-semibold text-[var(--foreground)] sm:text-lg">
          الحقول ({form.fields?.length ?? 0})
        </h2>
        <FormFieldsList fields={form.fields ?? []} formSlug={form.slug} />
      </DashboardSurface>

      <FormDeleteDialog
        isOpen={deleteOpen}
        onOpenChange={setDeleteOpen}
        formTitle={form.title}
        submissionCount={submissionCount}
        onConfirm={handleDelete}
      />
    </div>
  );
}
