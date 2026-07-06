'use client';

import type { Key } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Eye,
  PencilLine,
  ShieldCheck,
} from 'lucide-react';
import { Label, ListBox, Select } from '@heroui/react';
import {
  FORM_TEAM_ROLE_DESCRIPTIONS,
  FORM_TEAM_ROLE_LABELS,
  type FormTeamRole,
} from '@/lib/form-team-api';
import { cn } from '@/lib/utils';

export const FORM_TEAM_ROLES: FormTeamRole[] = [
  'ADMIN',
  'EDITOR',
  'ANALYST',
  'VIEWER',
];

const FORM_TEAM_ROLE_ICONS: Record<FormTeamRole, LucideIcon> = {
  ADMIN: ShieldCheck,
  EDITOR: PencilLine,
  ANALYST: BarChart3,
  VIEWER: Eye,
};

export function FormTeamRoleIcon({
  role,
  className,
  iconClassName,
}: {
  role: FormTeamRole;
  className?: string;
  iconClassName?: string;
}) {
  const Icon = FORM_TEAM_ROLE_ICONS[role];

  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
        className,
      )}
    >
      <Icon className={cn('size-4', iconClassName)} strokeWidth={1.75} aria-hidden />
    </span>
  );
}

interface FormTeamRoleSelectProps {
  value: FormTeamRole;
  onChange: (role: FormTeamRole) => void;
  isDisabled?: boolean;
  showDescription?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export function FormTeamRoleSelect({
  value,
  onChange,
  isDisabled,
  showDescription = false,
  className,
  id,
  'aria-label': ariaLabel = 'الدور',
}: FormTeamRoleSelectProps) {
  function handleSelection(key: Key | null) {
    if (key == null) return;
    onChange(String(key) as FormTeamRole);
  }

  return (
    <div className={cn('space-y-1', className)}>
      <Select
        id={id}
        dir="rtl"
        className="form-team-role-select w-full"
        selectedKey={value}
        onSelectionChange={handleSelection}
        isDisabled={isDisabled}
        aria-label={ariaLabel}
      >
        <Label className="sr-only">{ariaLabel}</Label>
        <Select.Trigger
          dir="rtl"
          className={cn(
            'h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 !text-end',
            'transition-[border-color,box-shadow] duration-200',
            'focus:border-[var(--foreground)]/25 focus:ring-2 focus:ring-[var(--accent)]/40',
          )}
        >
          <Select.Value className="w-full truncate !text-end text-sm" />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover
          dir="rtl"
          placement="bottom"
          className="form-team-role-select__popover z-[200] min-w-[var(--trigger-width)]"
        >
          <ListBox dir="rtl" className="!text-end">
            {FORM_TEAM_ROLES.map((role) => (
              <ListBox.Item
                key={role}
                id={role}
                textValue={FORM_TEAM_ROLE_LABELS[role]}
                className="!justify-start !text-end py-1.5 text-sm"
              >
                {FORM_TEAM_ROLE_LABELS[role]}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      {showDescription ? (
        <p className="text-end text-[11px] leading-relaxed text-[var(--muted-foreground)]">
          {FORM_TEAM_ROLE_DESCRIPTIONS[value]}
        </p>
      ) : null}
    </div>
  );
}
