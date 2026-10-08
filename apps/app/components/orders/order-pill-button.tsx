import { cn } from '@/lib/utils';

export const orderPillButtonClass =
  'shrink-0 rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-[13px] font-medium text-[var(--foreground)] transition-opacity hover:opacity-90';

export function OrderPillButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" className={cn(orderPillButtonClass, className)} onClick={onClick}>
      {children}
    </button>
  );
}
