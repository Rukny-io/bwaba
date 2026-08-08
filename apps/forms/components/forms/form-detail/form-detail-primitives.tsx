import type { ReactNode } from 'react';
import { Switch } from '@heroui/react';
import { formDetailCardSurfaceClass } from '@/lib/form-detail-styles';
import { cn } from '@/lib/utils';

export function FormDetailSwitchRow({
  label,
  hint,
  checked,
  onChange,
  className,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4',
        formDetailCardSurfaceClass,
        className,
      )}
    >
      <div className="min-w-0 space-y-1 text-start">
        <p className="text-[13px] font-medium text-[var(--foreground)]">{label}</p>
        <p className="text-[12px] leading-relaxed text-[var(--muted-foreground)]">
          {hint}
        </p>
      </div>
      <Switch isSelected={checked} onChange={onChange} aria-label={label}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch>
    </div>
  );
}

export function FormDetailSubsection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <header className="px-0.5 text-start">
        <h3 className="text-[14px] font-semibold text-[var(--foreground)]">{title}</h3>
        {description ? (
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </header>
      <div className="flex flex-col gap-[12px]">{children}</div>
    </section>
  );
}
