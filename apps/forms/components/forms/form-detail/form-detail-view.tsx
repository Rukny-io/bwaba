'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Skeleton, Spinner } from '@heroui/react';
import {
  CircleDot,
  Copy,
  ExternalLink,
  Inbox,
  Layers,
  Link2,
  Trash2,
} from 'lucide-react';
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
  getFormStatusLabel,
  getFormTypeLabel,
  getPublicFormUrl,
} from '@/lib/forms-format';
import { formatNumber } from '@/lib/dashboard-format';
import { FormFieldsList } from '@/components/forms/form-detail/form-fields-list';
import { FormMultiStepPanel } from '@/components/forms/form-detail/form-multi-step-panel';
import { FormPublishSettingsPanel } from '@/components/forms/form-detail/form-publish-settings-panel';
import { FormOrphanedSubmissionsExportPanel } from '@/components/forms/form-detail/form-orphaned-submissions-export-panel';
import { fieldInputClass } from '@/components/forms/shared/form-field-input-class';
import { DashboardErrorState } from '@/components/app/dashboard-error-state';
import {
  DashboardMetricCard,
  type DashboardMetricChipTone,
} from '@/components/app/dashboard-metric-card';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { cn } from '@/lib/utils';
import {
  canAccessFormWorkspaceTab,
  getDefaultFormWorkspacePath,
  resolveFormAccessRole,
} from '@/lib/form-team-permissions';
import { useFormWorkspaceSeed } from '@/lib/use-form-workspace-seed';

function statusChipTone(status: FormStatus): DashboardMetricChipTone {
  if (status === 'PUBLISHED') return 'success';
  if (status === 'CLOSED') return 'warning';
  if (status === 'ARCHIVED') return 'danger';
  return 'neutral';
}

function statusChipLabel(status: FormStatus): string {
  if (status === 'PUBLISHED') return 'مباشر';
  if (status === 'CLOSED') return 'موقوف';
  if (status === 'ARCHIVED') return 'مؤرشف';
  return 'تحرير';
}

const STATUS_OPTIONS: { value: FormStatus; label: string }[] = [
  { value: 'DRAFT', label: 'مسودة' },
  { value: 'PUBLISHED', label: 'نشر' },
  { value: 'CLOSED', label: 'إغلاق' },
];

export function FormDetailView({ formId }: { formId: string }) {
  const router = useRouter();
  const seedForm = useFormWorkspaceSeed(formId);
  const [form, setForm] = useState<FormDetail | null>(seedForm);
  const [loading, setLoading] = useState(!seedForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [title, setTitle] = useState(seedForm?.title ?? '');
  const [description, setDescription] = useState(seedForm?.description ?? '');

  useEffect(() => {
    if (!seedForm) return;
    setForm(seedForm);
    setTitle(seedForm.title);
    setDescription(seedForm.description ?? '');
    setLoading(false);
  }, [seedForm]);

  const load = useCallback(async () => {
    const hasCachedForm = seedForm !== null;
    if (!hasCachedForm) setLoading(true);
    setError(null);
    try {
      const data = await getForm(formId);
      setForm(data);
      setTitle(data.title);
      setDescription(data.description ?? '');
    } catch (e) {
      if (!hasCachedForm) {
        setError(e instanceof ApiException ? e.message : 'تعذّر تحميل النموذج');
      }
    } finally {
      setLoading(false);
    }
  }, [formId, seedForm]);

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
      <div className="flex flex-col gap-6 sm:gap-8">
        <div className="grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              className="min-h-[7.25rem] rounded-2xl sm:min-h-[7.75rem]"
            />
          ))}
        </div>
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
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
  const fieldCount = form.fields?.length ?? 0;
  const publicUrl = getPublicFormUrl(form.slug);

  const summaryItems = [
    {
      icon: CircleDot,
      label: 'الحالة',
      value: getFormStatusLabel(form.status),
      comparisonPrimary: getFormTypeLabel(form.type),
      comparisonSecondary: 'نوع النموذج',
      tabular: false as const,
      chip: statusChipLabel(form.status),
      chipTone: statusChipTone(form.status),
    },
    {
      icon: Inbox,
      label: 'الاستجابات',
      value: formatNumber(submissionCount),
      comparisonPrimary: 'إجمالي الردود',
      comparisonSecondary: 'كل الوقت',
      tabular: true as const,
      chip: undefined,
      chipTone: undefined,
    },
    {
      icon: Layers,
      label: 'الحقول',
      value: formatNumber(fieldCount),
      comparisonPrimary: form.isMultiStep ? 'متعدد الخطوات' : 'خطوة واحدة',
      comparisonSecondary: 'بنية النموذج',
      tabular: true as const,
      chip: form.isMultiStep ? 'متعدد' : 'بسيط',
      chipTone: (form.isMultiStep ? 'success' : 'neutral') as DashboardMetricChipTone,
    },
    {
      icon: Link2,
      label: 'الرابط العام',
      value: `/${form.slug}`,
      comparisonPrimary: formatFormDate(form.updatedAt),
      comparisonSecondary: 'آخر تحديث',
      tabular: false as const,
      chip: form.status === 'PUBLISHED' ? 'مفعّل' : 'غير منشور',
      chipTone: (form.status === 'PUBLISHED' ? 'success' : 'neutral') as DashboardMetricChipTone,
    },
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SettingsSectionCard
        plain
        title="ملخص النموذج"
        description="نظرة سريعة على الحالة والاستجابات والبنية"
      >
        <div className="grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-4">
          {summaryItems.map((item) => (
            <DashboardMetricCard
              key={item.label}
              icon={item.icon}
              label={item.label}
              value={item.value}
              comparisonPrimary={item.comparisonPrimary}
              comparisonSecondary={item.comparisonSecondary}
              tabular={item.tabular}
              chip={item.chip}
              chipTone={item.chipTone}
            />
          ))}
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        bordered
        title="الحالة والإجراءات"
        description="غيّر حالة النشر أو نفّذ إجراءات على النموذج"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <Button
                key={value}
                variant={form.status === value ? 'primary' : 'tertiary'}
                size="sm"
                className="rounded-xl"
                isDisabled={statusBusy || form.status === value}
                onPress={() => void setStatus(value)}
              >
                {statusBusy && form.status !== value ? (
                  <Spinner size="sm" />
                ) : null}
                {label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-[var(--border)]/60 pt-4">
            {form.status === 'PUBLISHED' ? (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="tertiary" size="sm" className="rounded-xl">
                  <ExternalLink className="size-4" />
                  معاينة
                </Button>
              </a>
            ) : null}
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
      </SettingsSectionCard>

      <SettingsSectionCard
        bordered
        title="الإعدادات الأساسية"
        description="عنوان النموذج ووصفه الظاهر للمستجيبين"
      >
        <form
          onSubmit={(e) => void handleSave(e)}
          className="space-y-4"
        >
          <div className="space-y-2 text-start">
            <label htmlFor="edit-title" className="text-[13px] font-medium">
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
          <div className="space-y-2 text-start">
            <label htmlFor="edit-desc" className="text-[13px] font-medium">
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
          <div className="flex flex-col gap-3 border-t border-[var(--border)]/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-[var(--muted-foreground)]" dir="ltr">
              {publicUrl.replace(/^https?:\/\//, '')}
            </p>
            <Button
              type="submit"
              variant="primary"
              className="rounded-full px-6 sm:shrink-0"
              isDisabled={saving}
            >
              {saving ? 'جاري الحفظ…' : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
      </SettingsSectionCard>

      <FormPublishSettingsPanel
        form={form}
        onSaved={(next) => setForm((prev) => withFormSharingMeta(next, prev))}
      />

      <FormOrphanedSubmissionsExportPanel form={form} />

      <FormMultiStepPanel
        form={form}
        onSaved={(next) => setForm((prev) => withFormSharingMeta(next, prev))}
      />

      <SettingsSectionCard
        title={`الحقول (${fieldCount})`}
        description="عرض الحقول الحالية — عدّلها من المحرّر البصري"
        plain
      >
        <FormFieldsList fields={form.fields ?? []} formSlug={form.slug} />
      </SettingsSectionCard>

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
