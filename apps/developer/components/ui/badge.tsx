import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary:
          'border-transparent bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
        destructive:
          'border-transparent bg-[color-mix(in_srgb,var(--danger)_14%,var(--background))] text-[var(--danger)]',
        success:
          'border-transparent bg-[color-mix(in_srgb,var(--success)_14%,var(--background))] text-[var(--success)]',
        warning:
          'border-transparent bg-[color-mix(in_srgb,var(--warning)_14%,var(--background))] text-[var(--warning)]',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
