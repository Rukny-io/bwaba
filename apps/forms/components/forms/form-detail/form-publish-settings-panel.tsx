'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Description,
  Label,
  NumberField,
} from '@heroui/react';
import { ApiException } from '@/lib/api-client';
import { appToast } from '@/lib/app-toast';
import { FormPublishScheduleFields } from '@/components/forms/form-detail/form-publish-schedule-fields';
import {
  FormDetailSubsection,
  FormDetailSwitchRow,
} from '@/components/forms/form-detail/form-detail-primitives';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { formDetailCardSurfaceClass } from '@/lib/form-detail-styles';
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
      plain
      title="إعدادات النشر والحماية"
      description="تحكّم في من يمكنه الإرسال، ومتى، وبأي قيود"
    >
      <div className="space-y-6">
        <FormDetailSubsection
          title="الوصول والإرسال"
          description="من يمكنه تعبئة النموذج وكم مرة"
        >
          <FormDetailSwitchRow
            label="يتطلب تسجيل الدخول"
            hint="فقط المستخدمون المسجّلون يمكنهم الإرسال."
            checked={state.requiresAuthentication}
            onChange={(checked) => toggle('requiresAuthentication', checked)}
          />
          <FormDetailSwitchRow
            label="استجابة واحدة لكل مستخدم"
            hint="يمنع نفس الحساب من الإرسال أكثر من مرة."
            checked={state.oneResponsePerUser}
            onChange={(checked) => toggle('oneResponsePerUser', checked)}
          />
          <FormDetailSwitchRow
            label="السماح بإرسالات متعددة"
            hint="يسمح لنفس الزائر بإرسال أكثر من استجابة."
            checked={state.allowMultipleSubmissions}
            onChange={(checked) => toggle('allowMultipleSubmissions', checked)}
          />
        </FormDetailSubsection>

        <FormDetailSubsection
          title="الحماية والحدود"
          description="تقليل السبام وتحديد عدد الاستجابات"
        >
          <FormDetailSwitchRow
            label="Turnstile عند الإرسال"
            hint="تحقق Cloudflare خفيف يقلّل السبام على النموذج العام."
            checked={state.requireTurnstileOnSubmit}
            onChange={(checked) => toggle('requireTurnstileOnSubmit', checked)}
          />

          <div className={formDetailCardSurfaceClass}>
            <NumberField
              className="w-full max-w-sm text-start"
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
          </div>
        </FormDetailSubsection>

        <FormDetailSubsection
          title="الجدولة"
          description="متى يفتح النموذج ومتى يُغلق تلقائياً"
        >
          <div className={formDetailCardSurfaceClass}>
            <FormPublishScheduleFields
              range={state.scheduleRange}
              onRangeChange={(range) => toggle('scheduleRange', range)}
            />
          </div>

          <FormDetailSwitchRow
            label="إغلاق تلقائي بعد تاريخ الإغلاق"
            hint="يرفض الاستجابات بعد وقت الإغلاق المحدّد."
            checked={state.closeAfterDate}
            onChange={(checked) => toggle('closeAfterDate', checked)}
          />
        </FormDetailSubsection>

        {error ? (
          <p className="rounded-2xl bg-[var(--danger)]/10 px-4 py-3 text-[13px] text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end border-t border-[var(--border)]/60 pt-4">
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
