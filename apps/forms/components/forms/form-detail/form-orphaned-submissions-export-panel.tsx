'use client';

import { useState } from 'react';
import { Archive } from 'lucide-react';
import { Button } from '@heroui/react';
import { appToast } from '@/lib/app-toast';
import { exportOrphanedSubmissionsCsv, type FormDetail } from '@/lib/forms-api';
import { PLUS_PLAN_LABEL } from '@/lib/form-field-plan';
import { PlusPlanGate } from '@/components/plan/plan-feature-gate';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';

export function FormOrphanedSubmissionsExportPanel({
  form,
}: {
  form: FormDetail;
}) {
  const [exporting, setExporting] = useState(false);
  const submissionCount =
    form._count?.submissions ?? form.submissionCount ?? 0;

  if (submissionCount === 0) {
    return null;
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportOrphanedSubmissionsCsv(form.id);
      appToast.success('تم تصدير الاستجابات المحذوفة', {
        description: 'تحقق من ملف CSV في مجلد التنزيلات',
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'تعذّر تصدير الاستجابات المحذوفة';
      appToast.error(message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <SettingsSectionCard
      icon={Archive}
      title="الاستجابات من حقول محذوفة"
      description={`تصدير إجابات الحقول التي حُذفت أو استُبدلت من النموذج — متاح لمشتركي ${PLUS_PLAN_LABEL} فما فوق.`}
    >
      <PlusPlanGate
        description={`تصدير الاستجابات من الحقول المحذوفة متاح في باقة ${PLUS_PLAN_LABEL} فما فوق.`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            يُصدَّر ملف CSV يحتوي فقط على الإجابات غير المرتبطة بالحقول الحالية،
            مع معرّف كل استجابة وتاريخها.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0 rounded-xl"
            isDisabled={exporting}
            onPress={() => void handleExport()}
          >
            {exporting ? 'جاري التصدير…' : 'تصدير الاستجابات المحذوفة'}
          </Button>
        </div>
      </PlusPlanGate>
    </SettingsSectionCard>
  );
}
