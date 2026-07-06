'use client';

import { useState } from 'react';
import { Label, Switch } from '@heroui/react';
import { FieldTypePlusBadge } from '@/components/forms/add-field-catalog/field-type-plus-badge';
import { VerificationUpgradeDialog } from '@/components/forms/add-field-catalog/verification-upgrade-dialog';
import { usePlanFeature } from '@/components/plan/plan-feature-gate';

type VerificationFeature =
  | 'emailFieldVerification'
  | 'phoneWhatsappVerification';

interface FieldVerificationSwitchProps {
  feature: VerificationFeature;
  label: string;
  isSelected: boolean;
  onChange: (enabled: boolean) => void;
}

export function FieldVerificationSwitch({
  feature,
  label,
  isSelected,
  onChange,
}: FieldVerificationSwitchProps) {
  const { enabled: planAllows, plan, loading } = usePlanFeature(feature);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (loading) {
    return (
      <div
        className="h-8 w-44 animate-pulse rounded-xl bg-[var(--surface-secondary)]/80"
        aria-hidden
      />
    );
  }

  return (
    <>
      <Switch
        isSelected={isSelected}
        onChange={(checked) => {
          if (checked && !planAllows) {
            setUpgradeOpen(true);
            return;
          }
          onChange(checked);
        }}
      >
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Content>
          <span className="flex flex-wrap items-center gap-1.5">
            <Label className="text-sm font-medium">{label}</Label>
            {!planAllows ? <FieldTypePlusBadge /> : null}
          </span>
        </Switch.Content>
      </Switch>

      <VerificationUpgradeDialog
        open={upgradeOpen}
        feature={feature}
        plan={plan}
        onClose={() => setUpgradeOpen(false)}
      />
    </>
  );
}
