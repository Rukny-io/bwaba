'use client';

import Link from 'next/link';
import { Eye, Pencil, type LucideIcon } from 'lucide-react';
import { formsNavGlassClass } from '@/components/app/nav-glass';
import { getFormCreatingPath } from '@/lib/forms-paths';
import { cn } from '@/lib/utils';

interface FormPreviewPageChromeProps {
  slug: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

function NavActionLink({
  href,
  label,
  icon: Icon,
  filled,
  showLabel = true,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  filled?: boolean;
  showLabel?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        'flex h-8 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-medium transition-colors sm:px-3',
        filled
          ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
          : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={filled ? 2.2 : 1.8} />
      {showLabel ? (
        <span className="hidden sm:inline">{label}</span>
      ) : null}
    </Link>
  );
}

/** شريط علوي — نفس أسلوب `FormCreateToolbar` */
export function FormPreviewPageChrome({
  slug,
  backHref,
  backLabel = 'متابعة التحرير',
  className,
}: FormPreviewPageChromeProps) {
  const editHref = backHref ?? getFormCreatingPath(slug);

  return (
    <header
      className={cn('pointer-events-none fixed inset-x-0 top-0 z-30', className)}
    >
      <div className="pointer-events-auto flex items-center justify-between gap-2 px-3 pt-2.5 pb-1.5 sm:px-6 lg:pt-4">
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5',
            formsNavGlassClass,
          )}
        >
          <Eye
            className="size-4 shrink-0 text-[var(--muted-foreground)]"
            strokeWidth={1.8}
          />
          <span className="text-xs font-medium text-[var(--muted-foreground)] sm:text-sm">
            معاينة — كما يراه الزوار
          </span>
        </div>

        <div
          className={cn(
            'ms-auto flex items-center gap-1 px-1.5 py-1 sm:gap-1.5 sm:px-2 sm:py-1.5',
            formsNavGlassClass,
          )}
        >
          <NavActionLink
            href={editHref}
            label={backLabel}
            icon={Pencil}
            filled
          />
        </div>
      </div>
    </header>
  );
}
