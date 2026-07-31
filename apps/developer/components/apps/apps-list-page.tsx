'use client';

import Link from 'next/link';
import { ArrowLeft, Plus, Layers } from 'lucide-react';
import type { DeveloperApp } from '@/lib/api/types';
import { appDashboard } from '@/lib/app-routes';
import { AppCard } from '@/components/apps/app-card';
import { useTranslations } from '@/components/providers/translations-provider';
import { AppsLocaleBar } from '@/components/apps/apps-locale-bar';

interface AppsListPageProps {
  apps: DeveloperApp[];
}

export function AppsListPage({ apps }: AppsListPageProps) {
  const t = useTranslations();
  const a = t.apps;
  const isEmpty = apps.length === 0;

  return (
    <div className="space-y-8">
      <header className="space-y-2 text-center">
        <p className="text-xs font-medium tracking-wide text-[var(--primary)] uppercase">
          {a.hubLabel}
        </p>
        <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
          {isEmpty ? a.titleEmpty : a.titleSelect}
        </h1>
        <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
          {isEmpty ? a.subtitleEmpty : a.subtitleSelect}
        </p>
      </header>

      {isEmpty ? (
        <div className="dashboard-card flex flex-col items-center gap-4 rounded-2xl p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]">
            <Layers className="size-7" />
          </span>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
            {a.emptyBody}
          </p>
          <Link
            href="/apps/creation"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            {a.createApp}
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {apps.map((app) => (
            <AppCard key={app.appId} app={app} href={appDashboard(app.appId)} />
          ))}

          <Link
            href="/apps/creation"
            className="dashboard-card group flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border)] p-5 transition-colors hover:border-[var(--primary)] hover:bg-[var(--surface-secondary)]"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)]">
              <Plus className="size-5" />
            </span>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {a.createNew}
            </span>
          </Link>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-center text-xs text-[var(--muted-foreground)]">
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-[var(--foreground)]"
          >
            <ArrowLeft className="size-3" />
            {a.backHome}
          </Link>
        </p>
        <AppsLocaleBar />
      </div>
    </div>
  );
}
