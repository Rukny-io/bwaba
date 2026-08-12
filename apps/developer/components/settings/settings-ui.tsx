'use client';

import { Description, Label, Switch } from '@heroui/react';
import { cn } from '@/lib/utils';

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl bg-[var(--surface)] p-5 shadow-none sm:p-6">
      <div>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
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
        'flex w-full items-start justify-between gap-4 py-3',
        disabled && 'opacity-70',
      )}
    >
      <Switch.Content className="min-w-0 flex-1">
        <Label className="text-sm font-medium text-[var(--foreground)]">{label}</Label>
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
