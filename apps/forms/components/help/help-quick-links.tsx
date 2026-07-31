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
        'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {HELP_QUICK_LINKS.map((item) => {
        const Icon = ICONS[item.id] ?? FileText;
        return (
          <Link
            key={item.id}
            href={linkHref(item)}
            className="group flex items-center gap-4 rounded-2xl border border-[var(--border)]/80 bg-[var(--surface)] p-4 transition-[border-color,background-color,box-shadow] hover:border-[var(--primary)]/25 hover:bg-[var(--surface-secondary)] hover:shadow-sm sm:rounded-3xl sm:p-5"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--background)] transition-transform group-hover:scale-[1.03]">
              <Icon size={18} strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                {item.title}
              </h2>
              <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]/70">
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
