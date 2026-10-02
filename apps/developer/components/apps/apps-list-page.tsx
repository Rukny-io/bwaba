'use client';

import Link from 'next/link';
import { ArrowLeft, Plus, Layers } from 'lucide-react';
import type { DeveloperApp } from '@/lib/api/types';
import { appDashboard } from '@/lib/app-routes';
import { AppCard } from '@/components/apps/app-card';
import { DashboardEmptyState } from '@/components/app/dashboard-empty-state';
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
    <div className="dashboard-section-stack">
      <header className="space-y-2 text-center">
        <p className="text-xs font-medium tracking-wide text-[var(--primary)] uppercase">
          {a.hubLabel}
        </p>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          {isEmpty ? a.titleEmpty : a.titleSelect}
        </h1>
        <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
          {isEmpty ? a.subtitleEmpty : a.subtitleSelect}
        </p>
      </header>

      {isEmpty ? (
        <DashboardEmptyState
          icon={Layers}
          title={a.titleEmpty}
          description={a.emptyBody}
          className="dashboard-panel bg-[var(--surface)]"
          compact
        >
          <Link
            href="/apps/creation"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] px-5 text-[13px] font-medium text-[var(--background)] transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            {a.createApp}
          </Link>
        </DashboardEmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {apps.map((app) => (
            <AppCard key={app.appId} app={app} href={appDashboard(app.appId)} />
          ))}

          <Link
            href="/apps/creation"
            className="dashboard-panel group flex min-h-[120px] flex-col items-center justify-center gap-2.5 border border-dashed border-[var(--border)] bg-transparent p-5 transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_55%,var(--surface))]"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)] transition-colors group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)]">
              <Plus className="size-4" strokeWidth={1.75} />
            </span>
            <span className="text-[13px] font-semibold text-[var(--foreground)]">
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
