'use client';

import { Description, Switch } from '@heroui/react';
import { SlottedLabel } from '@/components/ui/slotted-label';
import { AppSettingsSection } from '@/components/settings/app-settings-section';
import { cn } from '@/lib/utils';

/** Developer settings section — same surface as App settings */
export function SettingsSection({
  title,
  description,
  children,
  footer,
  flush = false,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  flush?: boolean;
  className?: string;
}) {
  return (
    <AppSettingsSection
      title={title}
      description={description}
      footer={footer}
      flush={flush}
      className={className}
    >
      {children}
    </AppSettingsSection>
  );
}

export function optionPillClass(active: boolean, size: 'md' | 'lg' = 'md') {
  return cn(
    'inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors',
    size === 'lg' ? 'h-[46px] min-w-[4.75rem] px-3' : 'h-9 px-4',
    active
      ? 'bg-[var(--foreground)] text-[var(--background)]'
      : 'bg-[var(--surface-secondary)] text-[var(--foreground)] hover:bg-[var(--border)]',
  );
}

export function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={optionPillClass(active)}>
      {children}
    </button>
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Switch
      isSelected={checked}
      isDisabled={disabled}
      onChange={onChange}
      className={cn(
        'flex w-full items-start justify-between gap-4 px-4 py-3.5 sm:px-5 sm:py-4',
        disabled && 'opacity-70',
      )}
    >
      <Switch.Content className="min-w-0 flex-1">
        <SlottedLabel className="text-sm font-medium text-[var(--foreground)]">
          {label}
        </SlottedLabel>
        {description ? (
          <Description className="text-xs leading-relaxed">{description}</Description>
        ) : null}
      </Switch.Content>
      <Switch.Control className="mt-0.5 shrink-0">
        <Switch.Thumb />
      </Switch.Control>
    </Switch>
  );
}
