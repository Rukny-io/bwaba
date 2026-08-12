'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Receipt,
  ChevronDown,
  PlusCircle,
  ShieldCheck,
  Activity,
  Bug,
  Users,
  AlertTriangle,
  HelpCircle,
  AppWindow,
  LogIn,
  Shield,
  FileText,
} from 'lucide-react';
import { Dropdown } from '@heroui/react';
import { useTranslations } from '@/components/providers/translations-provider';
import { cn } from '@/lib/utils';
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher';
import type { AccessibleWorkspace } from '@/lib/workspace';
import {
  dashboardTopTabsChipClass,
  dashboardTopTabsGlassClass,
} from '@/components/app/nav-glass';

export function HeaderTopBar({
  workspaces,
  currentUserId,
}: {
  avatarUrl?: string | null;
  userName?: string | null;
  workspaces?: AccessibleWorkspace[];
  currentUserId?: string;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const appsActive = pathname === '/apps' || pathname.startsWith('/apps/');

  const chipTriggerClass = cn(dashboardTopTabsChipClass, 'gap-1 outline-none');

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden justify-start bg-transparent px-3 pt-3 pb-2 sm:flex sm:px-5 sm:pt-4">
      <nav
        aria-label={t.topbar.myApps}
        className={cn(
          'pointer-events-auto inline-flex w-auto max-w-full items-center gap-0.5 p-1 sm:gap-1 sm:p-1.5',
          dashboardTopTabsGlassClass,
          '![overflow:visible]',
        )}
      >
        {workspaces && workspaces.length > 1 && currentUserId ? (
          <WorkspaceSwitcher
            workspaces={workspaces}
            currentUserId={currentUserId}
            triggerClassName={chipTriggerClass}
          />
        ) : null}

        <Link
          href="/apps"
          aria-current={appsActive ? 'page' : undefined}
          className={cn(dashboardTopTabsChipClass, 'hidden sm:inline-flex')}
        >
          {t.topbar.myApps}
        </Link>

        <button
          type="button"
          className={cn(dashboardTopTabsChipClass, 'hidden lg:inline-flex')}
        >
          {t.topbar.requiredActions}
        </button>

        <button
          type="button"
          className={cn(dashboardTopTabsChipClass, 'hidden lg:inline-flex')}
        >
          {t.topbar.tools}
        </button>

        <Dropdown>
          <Dropdown.Trigger className={cn(chipTriggerClass, 'hidden lg:inline-flex')}>
            {t.topbar.docs}
            <ChevronDown size={14} className="opacity-70" />
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom start" offset={14} className="min-w-[13rem]">
            <Dropdown.Menu>
              <Dropdown.Item id="doc-app" textValue={t.topbar.docAppDev} className="gap-2">
                <AppWindow className="size-4 shrink-0" />
                {t.topbar.docAppDev}
              </Dropdown.Item>
              <Dropdown.Item id="doc-fb" textValue={t.topbar.docFbLogin} className="gap-2">
                <LogIn className="size-4 shrink-0" />
                {t.topbar.docFbLogin}
              </Dropdown.Item>
              <Dropdown.Item id="doc-platform" textValue={t.topbar.docPlatform} className="gap-2">
                <Shield className="size-4 shrink-0" />
                {t.topbar.docPlatform}
              </Dropdown.Item>
              <Dropdown.Item id="doc-all" textValue={t.topbar.docAll} className="gap-2">
                <FileText className="size-4 shrink-0" />
                {t.topbar.docAll}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        <Dropdown>
          <Dropdown.Trigger className={cn(chipTriggerClass, 'hidden lg:inline-flex')}>
            {t.topbar.support}
            <ChevronDown size={14} className="opacity-70" />
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom start" offset={14} className="min-w-[14rem]">
            <Dropdown.Menu>
              <Dropdown.Item id="status" textValue={t.topbar.platformStatus} className="gap-2">
                <Activity className="size-4 shrink-0" />
                {t.topbar.platformStatus}
              </Dropdown.Item>
              <Dropdown.Item id="bug" textValue={t.topbar.reportBug} className="gap-2">
                <Bug className="size-4 shrink-0" />
                {t.topbar.reportBug}
              </Dropdown.Item>
              <Dropdown.Item id="community" textValue={t.topbar.askCommunity} className="gap-2">
                <Users className="size-4 shrink-0" />
                {t.topbar.askCommunity}
              </Dropdown.Item>
              <Dropdown.Item id="incident" textValue={t.topbar.reportIncident} className="gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                {t.topbar.reportIncident}
              </Dropdown.Item>
              <Dropdown.Item id="support-all" textValue={t.topbar.allSupport} className="gap-2">
                <HelpCircle className="size-4 shrink-0" />
                {t.topbar.allSupport}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        <Dropdown>
          <Dropdown.Trigger className={cn(chipTriggerClass, 'max-w-[11rem] truncate sm:max-w-none')}>
            <span className="truncate">
              <span className="sm:hidden">0 {t.dashboard.iqd}</span>
              <span className="hidden sm:inline">
                {`${t.topbar.walletBalance}: 0 ${t.dashboard.iqd}`}
              </span>
            </span>
            <ChevronDown size={14} className="shrink-0 opacity-70" />
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom end" offset={14} className="min-w-[13rem]">
            <Dropdown.Menu>
              <Dropdown.Item id="top-up" textValue={t.topbar.topUp} className="gap-2">
                <PlusCircle className="size-4 shrink-0" />
                {t.topbar.topUp}
              </Dropdown.Item>
              <Dropdown.Item id="invoices" textValue={t.topbar.viewInvoices} className="gap-2">
                <Receipt className="size-4 shrink-0" />
                {t.topbar.viewInvoices}
              </Dropdown.Item>
              <Dropdown.Item id="licensing" textValue={t.topbar.licensing} className="gap-2">
                <ShieldCheck className="size-4 shrink-0" />
                {t.topbar.licensing}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </nav>
    </header>
  );
}
