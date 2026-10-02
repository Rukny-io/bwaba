'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DeveloperApp } from '@/lib/api/types';
import { useTranslations } from '@/components/providers/translations-provider';
import { resolveMediaUrl } from '@/lib/media-url';

interface AppCardProps {
  app: DeveloperApp;
  href: string;
}

export function AppCard({ app, href }: AppCardProps) {
  const t = useTranslations();
  const a = t.apps;
  const isRtl = t.common.switchLang === 'English' ? false : true;
  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  const [iconFailed, setIconFailed] = useState(false);

  const initials = app.name.trim().charAt(0).toUpperCase() || 'A';
  const iconSrc = resolveMediaUrl(app.icon);
  const typeLabel =
    app.appType === 'BUSINESS' ? a.typeBusiness : a.typeConsumer;

  return (
    <Link
      href={href}
      className="dashboard-panel group flex flex-col gap-3.5 p-4 transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_55%,var(--surface))] sm:p-5"
    >
      <div className="flex items-start gap-3">
        {iconSrc && !iconFailed ? (
          <img
            src={iconSrc}
            alt=""
            className="size-11 shrink-0 rounded-xl object-cover"
            onError={() => setIconFailed(true)}
          />
        ) : (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-sm font-bold text-[var(--foreground)]">
            {initials}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold text-[var(--foreground)]">
            {app.name}
          </h2>
          <p className="mt-0.5 truncate text-[12.5px] text-[var(--muted-foreground)]">
            {app.contactEmail}
          </p>
        </div>

        <Chevron
          className="size-4 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--foreground)] rtl:group-hover:-translate-x-0.5"
          aria-hidden
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
          {typeLabel}
        </span>
        <span
          dir="ltr"
          className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-0.5 font-mono text-[10px] text-[var(--muted-foreground)]"
        >
          {app.appId}
        </span>
        {app.verified ? (
          <span className="rounded-full bg-[color-mix(in_srgb,var(--success)_14%,var(--background))] px-2.5 py-0.5 text-[10px] font-medium text-[var(--success)]">
            {a.verified}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
