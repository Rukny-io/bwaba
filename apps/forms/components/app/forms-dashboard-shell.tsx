'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';import { Sparkles } from 'lucide-react';
import {
  FormsDashboardProvider,
  useFormsDashboard,
} from '@/components/app/forms-dashboard-context';
import { DashboardNav } from '@/components/app/dashboard-nav';
import { NotificationsAlertDialog } from '@/components/app/notifications-alert-dialog';
import { NotificationsPanel } from '@/components/app/notifications-panel';
import { DashboardMobileDock } from '@/components/app/dashboard-mobile-dock';
import { NotificationsQueryOpener } from '@/components/app/notifications-query-opener';
import { NotificationsLiveListener } from '@/components/app/notifications-live-listener';
import { ACCOUNTS_URL } from '@/lib/config';

const BILLING_URL = `${ACCOUNTS_URL.replace(/\/$/, '')}/manage/billing`;
const SIDE_PANEL_WIDTH = 320;

function FormsDashboardShellInner({
  children,
  username,
}: {
  children: ReactNode;
  username?: string | null;
}) {
  const { desktopNotificationsOpen, closeNotifications } = useFormsDashboard();
  const [showBanner, setShowBanner] = useState(true);

  return (
    <>
      <div className="flex h-full min-w-0 flex-1 gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="dashboard-shell relative flex min-h-0 min-w-0 flex-1 flex-col overflow-clip bg-[var(--background)] sm:rounded-3xl sm:border sm:border-[var(--border)] sm:bg-[var(--surface)]">
            <DashboardNav username={username} />
            <main className="flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="mx-auto w-full max-w-5xl px-4 pt-12 pb-[5.75rem] sm:px-4 sm:pt-14 sm:pb-6 md:px-6">
                {children}
              </div>
            </main>
          </div>
        </div>

        <div
          className={`hidden h-full shrink-0 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)] transition-[width] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] lg:block ${
            desktopNotificationsOpen ? '' : ''
          }`}
          style={{ width: desktopNotificationsOpen ? SIDE_PANEL_WIDTH : 0 }}
          aria-hidden={!desktopNotificationsOpen}
        >
          <div className="h-full" style={{ width: SIDE_PANEL_WIDTH }}>
            {desktopNotificationsOpen && (
              <NotificationsPanel onClose={closeNotifications} />
            )}
          </div>
        </div>
      </div>

      <NotificationsAlertDialog />
    </>
  );
}

export function FormsDashboardShell({
  children,
  username,
}: {
  children: ReactNode;
  username?: string | null;
}) {
  return (
    <FormsDashboardProvider>
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Suspense fallback={null}>
          <NotificationsQueryOpener />
        </Suspense>
        <NotificationsLiveListener />
        <FormsDashboardShellInner username={username}>
          {children}
        </FormsDashboardShellInner>
        <DashboardMobileDock />
      </div>
    </FormsDashboardProvider>
  );
}
