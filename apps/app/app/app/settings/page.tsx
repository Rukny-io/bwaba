import { Suspense } from 'react';
import { SettingsView } from '@/components/settings/settings-view';

function SettingsViewFallback() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--surface-secondary)]" />
      <div className="h-40 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="dashboard-page flex w-full min-w-0 flex-col pt-5 sm:pt-6">
      <Suspense fallback={<SettingsViewFallback />}>
        <SettingsView />
      </Suspense>
    </div>
  );
}
