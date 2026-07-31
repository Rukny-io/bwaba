'use client';

import { Columns2, Plus } from 'lucide-react';
import { Button } from '@heroui/react';
import { PlanFeatureGate } from '@/components/plan/plan-feature-gate';
import { cn } from '@/lib/utils';

interface FormAddSectionButtonProps {
  onAdd: () => void;
  disabled?: boolean;
  className?: string;
}

export function FormAddSectionButton({
  onAdd,
  disabled,
  className,
}: FormAddSectionButtonProps) {
  return (
    <PlanFeatureGate
      feature="multiStepForms"
      description="تقسيم النموذج إلى أقسام متاح في الخطط المدفوعة."
    >
      <Button
        variant="outline"
        isDisabled={disabled}
        onPress={onAdd}
        className={cn(
          'h-10 w-full gap-2 rounded-2xl border-dashed border-[var(--border)] bg-[var(--surface)]/60 text-sm font-medium sm:w-auto sm:min-w-[12rem]',
          className,
        )}
      >
        <Columns2 className="size-4 shrink-0 text-[var(--primary)]" strokeWidth={1.8} />
        <span>إضافة قسم</span>
        <Plus className="size-3.5 shrink-0 opacity-60" />
      </Button>
    </PlanFeatureGate>
  );
}
