'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { CalendarClock, Shield, Users } from 'lucide-react';
import {
  Button,
  Description,
  Label,
  NumberField,
  Separator,
  Switch,
} from '@heroui/react';
import { ApiException } from '@/lib/api-client';
import { appToast } from '@/lib/app-toast';
import { FormPublishScheduleFields } from '@/components/forms/form-detail/form-publish-schedule-fields';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import {
  scheduleFromForm,
  scheduleToIso,
  type ScheduleRange,
} from '@/lib/publish-schedule-utils';
import {
  updateForm,
  type FormDetail,
  type UpdateFormPayload,
} from '@/lib/forms-api';

interface PublishSettingsState {
  allowMultipleSubmissions: boolean;
  requiresAuthentication: boolean;
  requireTurnstileOnSubmit: boolean;
  oneResponsePerUser: boolean;
  submissionLimit: number | null;
  scheduleRange: ScheduleRange;
  closeAfterDate: boolean;
}

function stateFromForm(form: FormDetail): PublishSettingsState {
  return {
    allowMultipleSubmissions: Boolean(form.allowMultipleSubmissions),
    requiresAuthentication: Boolean(form.requiresAuthentication),
    requireTurnstileOnSubmit: Boolean(form.requireTurnstileOnSubmit),
    oneResponsePerUser: Boolean(form.oneResponsePerUser),
    submissionLimit: form.submissionLimit ?? null,
    scheduleRange: scheduleFromForm(form.opensAt, form.closesAt),
    closeAfterDate: Boolean(form.closeAfterDate),
  };
}

function payloadFromState(state: PublishSettingsState): UpdateFormPayload {
  const { opensAt, closesAt } = scheduleToIso(state.scheduleRange);

  return {
    allowMultipleSubmissions: state.allowMultipleSubmissions,
    requiresAuthentication: state.requiresAuthentication,
    requireTurnstileOnSubmit: state.requireTurnstileOnSubmit,
    oneResponsePerUser: state.oneResponsePerUser,
    submissionLimit:
      state.submissionLimit != null && state.submissionLimit > 0
        ? state.submissionLimit
        : undefined,
    opensAt,
    closesAt,
    closeAfterDate: state.closeAfterDate,
  };
}

export function FormPublishSettingsPanel({
  form,
  onSaved,
}: {
  form: FormDetail;
  onSaved: (next: FormDetail) => void;
}) {
  const [state, setState] = useState(() => stateFromForm(form));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync when parent form updates after save
    setState(stateFromForm(form));
  }, [form]);

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const updated = await updateForm(form.id, payloadFromState(state));
      onSaved(updated);
      appToast.success('تم حفظ إعدادات النشر');
    } catch (e) {
      const msg = e instanceof ApiException ? e.message : 'تعذّر الحفظ';
      setError(msg);
      appToast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  function toggle<K extends keyof PublishSettingsState>(
    key: K,
    value: PublishSettingsState[K],
  ) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <SettingsSectionCard
      icon={Shield}
      title="إعدادات النشر والحماية"
      description="تحكّم في من يمكنه الإرسال، ومتى، وبأي قيود."
    >
      <div className="space-y-6">
        <PublishSettingsGroup
          icon={Users}
          title="الوصول والإرسال"
          description="من يمكنه تعبئة النموذج وكم مرة."
        >
          <SettingRow
            label="يتطلب تسجيل الدخول"
            hint="فقط المستخدمون المسجّلون يمكنهم الإرسال."
            checked={state.requiresAuthentication}
            onChange={(checked) => toggle('requiresAuthentication', checked)}
          />
          <SettingRow
            label="استجابة واحدة لكل مستخدم"
            hint="يمنع نفس الحساب من الإرسال أكثر من مرة."
            checked={state.oneResponsePerUser}
            onChange={(checked) => toggle('oneResponsePerUser', checked)}
          />
          <SettingRow
            label="السماح بإرسالات متعددة"
            hint="يسمح لنفس الزائر بإرسال أكثر من استجابة."
            checked={state.allowMultipleSubmissions}
            onChange={(checked) => toggle('allowMultipleSubmissions', checked)}
          />
        </PublishSettingsGroup>

        <Separator className="bg-[var(--border)]/60" />

        <PublishSettingsGroup
          icon={Shield}
          title="الحماية والحدود"
          description="تقليل السبام وتحديد عدد الاستجابات."
        >
          <SettingRow
            label="Turnstile عند الإرسال"
            hint="تحقق Cloudflare خفيف يقلّل السبام على النموذج العام."
            checked={state.requireTurnstileOnSubmit}
            onChange={(checked) => toggle('requireTurnstileOnSubmit', checked)}
          />

          <NumberField
            className="w-full max-w-sm"
            value={state.submissionLimit ?? undefined}
            onChange={(value) =>
              toggle(
                'submissionLimit',
                value != null && !Number.isNaN(value) ? value : null,
              )
            }
            minValue={1}
            aria-label="حد أقصى للاستجابات"
            fullWidth
          >
            <Label>حد أقصى للاستجابات</Label>
            <NumberField.Group>
              <NumberField.DecrementButton />
              <NumberField.Input placeholder="بدون حد" />
              <NumberField.IncrementButton />
            </NumberField.Group>
            <Description>
              اتركه فارغاً لعدم التحديد. يُغلق النموذج عند الوصول للحد.
            </Description>
          </NumberField>
        </PublishSettingsGroup>

        <Separator className="bg-[var(--border)]/60" />

        <PublishSettingsGroup
          icon={CalendarClock}
          title="الجدولة"
          description="متى يفتح النموذج ومتى يُغلق تلقائياً."
        >
          <FormPublishScheduleFields
            range={state.scheduleRange}
            onRangeChange={(range) => toggle('scheduleRange', range)}
          />

          <SettingRow
            label="إغلاق تلقائي بعد تاريخ الإغلاق"
            hint="يرفض الاستجابات بعد وقت الإغلاق المحدّد."
            checked={state.closeAfterDate}
            onChange={(checked) => toggle('closeAfterDate', checked)}
          />
        </PublishSettingsGroup>

        {error ? (
          <p className="rounded-xl bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end pt-1">
          <Button
            variant="primary"
            className="rounded-full px-6"
            isDisabled={busy}
            onPress={() => void handleSave()}
          >
            {busy ? 'جاري الحفظ…' : 'حفظ إعدادات النشر'}
          </Button>
        </div>
      </div>
    </SettingsSectionCard>
  );
}

function PublishSettingsGroup({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)]">
          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 space-y-0.5">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {title}
          </h3>
          <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
            {description}
          </p>
        </div>
      </div>
      <div className="space-y-3 ps-0 sm:ps-12">{children}</div>
    </section>
  );
}

function SettingRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <DashboardSurface
      padding="sm"
      className="flex items-start justify-between gap-4 bg-[var(--surface-secondary)]/40"
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
        <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {hint}
        </p>
      </div>
      <Switch isSelected={checked} onChange={onChange} aria-label={label}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch>
    </DashboardSurface>
  );
}
