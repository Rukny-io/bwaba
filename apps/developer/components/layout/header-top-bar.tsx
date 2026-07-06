'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { resolveMediaUrl } from '@/lib/media-url';
import {
  LogOut,
  Settings,
  User,
  Receipt,
  Globe,
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
import { logoutWithNotification } from '@/lib/auth-notify';
import { useTranslations } from '@/components/providers/translations-provider';
import { setLocaleAction } from '@/actions/set-locale';
import { cn } from '@/lib/utils';

export function HeaderTopBar({
  avatarUrl,
  userName,
}: {
  avatarUrl?: string | null;
  userName?: string | null;
}) {
  const t = useTranslations();

  const displayName = userName?.trim() || 'م';
  const initials = displayName.charAt(0).toUpperCase();
  const src = resolveMediaUrl(avatarUrl);
  const [failed, setFailed] = useState(false);

  const pillClass =
    'touch-target inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] sm:px-4 outline-none';
  const activePillClass =
    'touch-target inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-3 py-2 text-sm font-medium text-[var(--background)] transition-colors sm:px-4 outline-none';

  async function handleLangSwitch() {
    const isEn = t.common.switchLang === 'العربية';
    await setLocaleAction(isEn ? 'ar' : 'en');
    window.location.reload();
  }

  return (
    <header className="flex items-center justify-between gap-2 overflow-visible px-1 sm:justify-end sm:gap-4 sm:px-4">
      <div className="flex min-w-0 items-center gap-2 sm:hidden">
        <Image
          src="/rukny-logo.svg"
          alt="Rukny"
          width={28}
          height={28}
          className="shrink-0 dark:brightness-0 dark:invert"
        />
        <span className="truncate text-sm font-semibold text-[var(--foreground)]">
          Rukny
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 overflow-visible sm:gap-2">
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/apps" className={activePillClass}>
            {t.topbar.myApps}
          </Link>
          <button type="button" className={pillClass}>
            {t.topbar.requiredActions}
          </button>
          <button type="button" className={pillClass}>
            {t.topbar.tools}
          </button>

          <Dropdown>
            <Dropdown.Trigger className={pillClass}>
              {t.topbar.docs}
              <ChevronDown size={16} />
            </Dropdown.Trigger>
            <Dropdown.Popover placement="bottom start" className="min-w-[13rem]">
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
            <Dropdown.Trigger className={pillClass}>
              {t.topbar.support}
              <ChevronDown size={16} />
            </Dropdown.Trigger>
            <Dropdown.Popover placement="bottom start" className="min-w-[14rem]">
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
        </div>

        <Link href="/apps" className={`${activePillClass} hidden sm:inline-flex lg:hidden`}>
          {t.topbar.myApps}
        </Link>

        <Dropdown>
          <Dropdown.Trigger
            className={cn(pillClass, 'max-w-[11rem] truncate sm:max-w-none')}
          >
            <span className="truncate">
              <span className="sm:hidden">0 {t.dashboard.iqd}</span>
              <span className="hidden sm:inline">
                {`${t.topbar.walletBalance}: 0 ${t.dashboard.iqd}`}
              </span>
            </span>
            <ChevronDown size={16} className="shrink-0" />
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom end" className="min-w-[13rem]">
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

        <Dropdown>
          <Dropdown.Trigger
            aria-label={t.topbar.profile}
            className="touch-target flex size-10 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            {src && !failed ? (
              <img
                src={src}
                alt={displayName}
                className="block h-full w-full object-cover"
                onError={() => setFailed(true)}
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-sm font-semibold text-[var(--primary-foreground)]">
                {initials}
              </div>
            )}
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom end" className="min-w-[13rem]">
            <Dropdown.Menu
              onAction={(key) => {
                if (key === 'lang') void handleLangSwitch();
                if (key === 'logout') void logoutWithNotification();
              }}
            >
              <Dropdown.Item
                id="profile"
                textValue={t.topbar.profile}
                href="/settings"
                className="gap-2"
              >
                <User className="size-4 shrink-0" />
                {t.topbar.profile}
              </Dropdown.Item>
              <Dropdown.Item
                id="settings"
                textValue={t.topbar.settings}
                href="/settings"
                className="gap-2"
              >
                <Settings className="size-4 shrink-0" />
                {t.topbar.settings}
              </Dropdown.Item>
              <Dropdown.Item id="billing" textValue={t.topbar.billing} className="gap-2">
                <Receipt className="size-4 shrink-0" />
                {t.topbar.billing}
              </Dropdown.Item>
              <Dropdown.Item id="lang" textValue={t.common.switchLang} className="gap-2">
                <Globe className="size-4 shrink-0" />
                {t.common.switchLang}
              </Dropdown.Item>
              <Dropdown.Item
                id="logout"
                textValue={t.topbar.logout}
                variant="danger"
                className="gap-2"
              >
                <LogOut className="size-4 shrink-0" />
                {t.topbar.logout}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </header>
  );
}
