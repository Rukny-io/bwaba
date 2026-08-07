'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Skeleton, Spinner } from '@heroui/react';
import {
  CalendarClock,
  CircleDot,
  Copy,
  ExternalLink,
  Inbox,
  Layers,
  ListChecks,
  PencilLine,
  Radio,
  Trash2,
  Zap,
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
      <div className="flex flex-col gap-3.5 sm:gap-4">
        <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              className="min-h-[7.5rem] rounded-3xl sm:min-h-[8rem]"
            />
          ))}
        </div>
        <Skeleton className="h-20 w-full rounded-3xl" />
        <Skeleton className="h-52 w-full rounded-3xl" />
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
  const fieldCount = form.fields?.length ?? 0;

  const summaryItems = [
    {
      icon: CircleDot,
      label: 'الحالة',
      value: getFormStatusLabel(form.status),
      comparisonPrimary: getFormTypeLabel(form.type),
      comparisonSecondary: 'حالة النشر',
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
      icon: CalendarClock,
      label: 'آخر تحديث',
      value: formatFormDate(form.updatedAt),
      comparisonPrimary: `/${form.slug}`,
      comparisonSecondary: 'رابط النموذج',
      tabular: false as const,
      chip: undefined,
      chipTone: undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4">
      <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
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

      <SettingsSectionCard
        icon={Zap}
        title="إجراءات سريعة"
        description="معاينة، نسخ، أو حذف النموذج"
      >
        <div className="flex flex-wrap gap-2">
          {form.status === 'PUBLISHED' ? (
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
      </SettingsSectionCard>

      <SettingsSectionCard
        icon={PencilLine}
        title="الإعدادات الأساسية"
        description="عنوان النموذج ووصفه الظاهر للمستجيبين"
      >
        <form
          onSubmit={(e) => void handleSave(e)}
          className="max-w-lg space-y-4"
        >
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
          <Button
            type="submit"
            variant="primary"
            className="rounded-full px-6"
            isDisabled={saving}
          >
            {saving ? 'جاري الحفظ…' : 'حفظ التغييرات'}
          </Button>
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
        icon={Radio}
        title="الحالة والنشر"
        description="غيّر حالة النموذج بين مسودة ومنشور ومغلق"
      >
        <div className="flex flex-wrap gap-2">
          {(['DRAFT', 'PUBLISHED', 'CLOSED'] as FormStatus[]).map((s) => (
            <Button
              key={s}
              variant={form.status === s ? 'primary' : 'tertiary'}
              size="sm"
              className="rounded-xl"
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
      </SettingsSectionCard>

      <SettingsSectionCard
        icon={ListChecks}
        title={`الحقول (${fieldCount})`}
        description="عرض الحقول الحالية — عدّلها من المحرّر"
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
