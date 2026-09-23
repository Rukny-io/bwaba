import { cn } from '@/lib/utils';

/** Nested surface on zinc-100 sections — white, no border/shadow */
export function SoftPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white px-3.5 py-3 text-zinc-900',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FormAlert({
  children,
  tone = 'danger',
}: {
  children: React.ReactNode;
  tone?: 'danger' | 'warning' | 'info';
}) {
  return (
    <p
      className={cn(
        'rounded-2xl px-3.5 py-2.5 text-[13px] leading-5',
        tone === 'danger' && 'bg-red-50 text-red-700',
        tone === 'warning' && 'bg-amber-50 text-amber-800',
        tone === 'info' && 'bg-white text-zinc-600',
      )}
    >
      {children}
    </p>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] leading-5 text-zinc-500">{children}</p>
  );
}

export function TextLink({
  children,
  className,
  ...props
}: React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Primary full-width CTA */
export const checkoutCtaClass =
  'h-11 w-full rounded-full text-[15px] font-medium shadow-none';

/** Secondary full-width action (white on zinc) */
export const checkoutSecondaryCtaClass =
  'h-11 w-full rounded-full border-0 bg-white text-[15px] font-medium text-zinc-900 shadow-none hover:bg-white/80';
