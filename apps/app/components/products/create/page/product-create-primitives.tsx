import type { LucideIcon } from 'lucide-react';
import { Card, Chip, Surface, cn } from '@heroui/react';

export function ProductCreatePill({
  icon: Icon,
  label,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  className?: string;
}) {
  return (
    <Chip
      size="sm"
      variant="soft"
      className={cn('h-auto max-w-full gap-2 rounded-full py-1 pe-3 ps-1', className)}
    >
      {Icon ? (
        <Surface
          variant="default"
          className="flex size-7 shrink-0 items-center justify-center rounded-full sm:size-8"
        >
          <Icon size={16} strokeWidth={1.85} aria-hidden />
        </Surface>
      ) : null}
      <span className="truncate text-[12px] font-semibold tracking-tight sm:text-[13px]">
        {label}
      </span>
    </Chip>
  );
}

export function ProductCreateTypeTile({
  label,
  hint,
  icon: Icon,
  onClick,
}: {
  label: string;
  hint: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      <Card
        variant="secondary"
        className="gap-0 p-3.5 transition-colors group-hover:bg-surface-secondary/80 sm:p-4"
      >
        <Card.Content className="flex-row items-start gap-3 p-0">
          <Surface
            variant="default"
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-muted transition-colors group-hover:text-foreground"
          >
            <Icon size={18} strokeWidth={1.85} className="sm:size-5" aria-hidden />
          </Surface>
          <div className="min-w-0 flex-1">
            <Card.Title className="text-[13px] font-bold leading-tight sm:text-sm">
              {label}
            </Card.Title>
            <Card.Description className="mt-1 line-clamp-2 text-[10px] leading-snug sm:text-[11px]">
              {hint}
            </Card.Description>
          </div>
        </Card.Content>
      </Card>
    </button>
  );
}
