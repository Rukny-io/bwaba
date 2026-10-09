'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertCircle,
  Code2,
  FileText,
  KeyRound,
  ArrowLeft,
  LayoutGrid,
  MessageSquare,
  Play,
  Plus,
  Webhook,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Dropdown, Label } from '@heroui/react';
import { useCurrentApp } from '@/components/providers/app-context';
import {
  MobileDockShell,
  MobileDockPill,
  MobileDockNavLink,
  mobileDockSideButtonClass,
} from '@/components/layout/mobile-dock-primitives';
import { useTranslations } from '@/components/providers/translations-provider';
import {
  WHATSAPP_API_NAV_SECTIONS,
  WHATSAPP_API_SECTIONS,
  type WhatsappApiSectionId,
} from '@/lib/whatsapp-api-catalog';
import {
  appWhatsappApiHref,
  isWhatsappApiSectionActive,
} from '@/lib/whatsapp-api-routes';
import { appDashboard } from '@/lib/app-routes';
import { cn } from '@/lib/utils';

const BAR_SECTION_IDS = new Set<WhatsappApiSectionId>(
  WHATSAPP_API_NAV_SECTIONS.map((s) => s.id as WhatsappApiSectionId),
);

const SECTION_ICONS: Record<WhatsappApiSectionId, LucideIcon> = {
  overview: LayoutGrid,
  auth: KeyRound,
  messages: MessageSquare,
  templates: FileText,
  webhooks: Webhook,
  errors: AlertCircle,
  try: Play,
  sdks: Code2,
};

function MoreMenuItem({
  id,
  label,
  icon: Icon,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Dropdown.Item id={id} textValue={label}>
      <Dropdown.ItemIndicator />
      <Icon
        size={16}
        strokeWidth={1.9}
        className="shrink-0 text-[var(--muted-foreground)]"
        aria-hidden
      />
      <Label>{label}</Label>
    </Dropdown.Item>
  );
}

export function WhatsappApiMobileDock() {
  const pathname = usePathname();
  const router = useRouter();
  const { app } = useCurrentApp();
  const d = useTranslations().whatsappApi;
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const barSections = WHATSAPP_API_NAV_SECTIONS;
  const moreSections = useMemo(
    () =>
      WHATSAPP_API_SECTIONS.filter(
        (section) => !BAR_SECTION_IDS.has(section.id as WhatsappApiSectionId),
      ),
    [],
  );

  const sectionLabel = (labelKey: (typeof WHATSAPP_API_SECTIONS)[number]['labelKey']) =>
    d[labelKey];

  const activeMoreKey = useMemo(() => {
    const match = moreSections.find((section) =>
      isWhatsappApiSectionActive(
        pathname,
        app.appId,
        section.id as WhatsappApiSectionId,
      ),
    );
    return match ? appWhatsappApiHref(app.appId, match.id as WhatsappApiSectionId) : null;
  }, [app.appId, moreSections, pathname]);

  return (
    <MobileDockShell>
      <Link
        href={appDashboard(app.appId)}
        aria-label={t.mobile.backToMenu}
        className={mobileDockSideButtonClass}
      >
        <ArrowLeft
          className="size-5 rtl:rotate-180"
          strokeWidth={2}
          aria-hidden
        />
      </Link>

      <MobileDockPill aria-label={d.navIslandAria}>
        {barSections.map((section) => {
          const sectionId = section.id as WhatsappApiSectionId;
          const href = appWhatsappApiHref(app.appId, sectionId);
          const active = isWhatsappApiSectionActive(
            pathname,
            app.appId,
            sectionId,
          );
          return (
            <MobileDockNavLink
              key={section.id}
              href={href}
              icon={SECTION_ICONS[sectionId]}
              label={sectionLabel(section.labelKey)}
              isActive={active}
            />
          );
        })}
      </MobileDockPill>

      <Dropdown isOpen={open} onOpenChange={setOpen}>
        <Dropdown.Trigger
          aria-label={
            open ? t.mobile.closeMoreSections : t.mobile.openMoreSections
          }
          className={cn(
            mobileDockSideButtonClass,
            open || activeMoreKey
              ? 'bg-[var(--foreground)] text-[var(--background)] hover:text-[var(--background)]'
              : undefined,
          )}
        >
          {open ? (
            <X size={19} strokeWidth={2.2} aria-hidden />
          ) : (
            <Plus size={20} strokeWidth={2.1} aria-hidden />
          )}
        </Dropdown.Trigger>
        <Dropdown.Popover
          placement="top"
          className="min-w-[16rem] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--field-background)]"
        >
          <Dropdown.Menu
            selectedKeys={activeMoreKey ? new Set([activeMoreKey]) : new Set()}
            selectionMode="single"
            onAction={(key) => {
              const href = String(key);
              setOpen(false);
              router.push(href);
            }}
          >
            <Dropdown.Section>
              {moreSections.map((section) => {
                const sectionId = section.id as WhatsappApiSectionId;
                const href = appWhatsappApiHref(app.appId, sectionId);
                return (
                  <MoreMenuItem
                    key={section.id}
                    id={href}
                    label={sectionLabel(section.labelKey)}
                    icon={SECTION_ICONS[sectionId]}
                  />
                );
              })}
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </MobileDockShell>
  );
}
