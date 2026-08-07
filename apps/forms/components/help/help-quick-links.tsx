'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  BarChart2,
  FileText,
  Inbox,
  LayoutTemplate,
  Palette,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { HELP_QUICK_LINKS, type HelpQuickLink } from '@/lib/help/help-content';
import { cn } from '@/lib/utils';

const ICONS: Record<string, LucideIcon> = {
  create: FileText,
  templates: LayoutTemplate,
  design: Palette,
  submissions: Inbox,
  analytics: BarChart2,
  settings: Settings,
};

function linkHref(item: HelpQuickLink): string {
  if (!item.anchor) return item.href;
  return `${item.href}#${item.anchor}`;
}

export function HelpQuickLinks({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3',
        className,
      )}
    >
      {HELP_QUICK_LINKS.map((item) => {
        const Icon = ICONS[item.id] ?? FileText;
        return (
          <Link
            key={item.id}
            href={linkHref(item)}
            className={cn(
              'group flex items-center gap-3 rounded-2xl bg-[var(--surface-secondary)]/30 p-3.5 sm:rounded-3xl sm:p-4',
              'transition-[border-color,background-color,box-shadow,transform] duration-200',
              'hover:border-[color-mix(in_srgb,var(--primary)_28%,var(--border))] hover:bg-[color-mix(in_srgb,var(--primary)_5%,var(--surface))]',
            )}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--primary)] ring-1 ring-[var(--border)]/40 transition-transform group-hover:scale-[1.03]">
              <Icon className="size-4" strokeWidth={1.85} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {item.title}
              </h3>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted-foreground)] sm:text-[12px]">
                {item.description}
              </p>
            </div>
            <ArrowLeft
              className="size-4 shrink-0 text-[var(--muted-foreground)] transition-[transform,color] group-hover:-translate-x-0.5 group-hover:text-[var(--primary)]"
              aria-hidden
            />
          </Link>
        );
      })}
    </div>
  );
}
