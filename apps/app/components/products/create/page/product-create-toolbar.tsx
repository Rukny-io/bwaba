'use client';

import Link from 'next/link';
import { ChevronRight, CircleCheck, Loader2 } from 'lucide-react';
import { Button } from '@heroui/react';

const toolbarClusterClass =
  'product-create-toolbar-glass inline-flex min-h-10 min-w-0 items-center gap-0.5 p-1 sm:min-h-9 sm:gap-1 sm:p-1';

const toolbarBackLinkClass =
  'inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-black/[0.06] hover:text-[var(--foreground)] dark:hover:bg-white/10 sm:h-8 sm:px-3 sm:text-[13px]';

interface ProductCreateToolbarProps {
  backHref: string;
  backLabel?: string;
  submitLabel?: string;
  submitFormId?: string;
  submitting?: boolean;
  submitDisabled?: boolean;
  onSubmit?: () => void;
}

export function ProductCreateToolbar({
  backHref,
  backLabel = 'رجوع',
  submitLabel,
  submitFormId,
  submitting = false,
  submitDisabled = false,
  onSubmit,
}: ProductCreateToolbarProps) {
  const showSubmit = Boolean(submitLabel && (submitFormId || onSubmit));

  return (
    <header className="product-create-toolbar-shell">
      <div className="pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-3 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4 sm:pb-2.5 sm:pt-[max(0.625rem,env(safe-area-inset-top))]">
        <div className={toolbarClusterClass}>
          <Link href={backHref} className={toolbarBackLinkClass}>
            <ChevronRight className="size-4 shrink-0" strokeWidth={2} />
            <span className="whitespace-nowrap">{backLabel}</span>
          </Link>
        </div>

        {showSubmit ? (
          <Button
            type={submitFormId ? 'submit' : 'button'}
            form={submitFormId}
            onPress={onSubmit}
            isDisabled={submitDisabled || submitting}
            variant="primary"
            size="sm"
            className="product-create-toolbar-submit h-10 shrink-0 rounded-full px-4 text-sm font-semibold sm:h-9 sm:px-3.5 sm:text-[13px]"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <CircleCheck className="size-4 shrink-0" strokeWidth={2.2} />
            )}
            <span className="whitespace-nowrap">{submitLabel}</span>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
