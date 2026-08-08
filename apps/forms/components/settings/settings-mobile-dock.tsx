'use client';

import {
  Gauge,
  HardDrive,
  LayoutGrid,
  Link2,
  Palette,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';
import { APP_BASE } from '@/components/app/nav-config';
import {
  MobileDockShell,
  MobileDockPill,
  MobileDockItem,
} from '@/components/app/mobile-dock-primitives';

export type SettingsSectionId =
  | 'overview'
  | 'storage'
  | 'account'
  | 'preferences'
  | 'links';

const SECTION_ITEMS: {
  id: SettingsSectionId;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: 'overview', label: 'عامة', icon: Gauge },
  { id: 'storage', label: 'تخزين', icon: HardDrive },
  { id: 'account', label: 'الحساب', icon: UserCircle },
  { id: 'preferences', label: 'تفضيلات', icon: Palette },
  { id: 'links', label: 'روابط', icon: Link2 },
];

interface SettingsMobileDockProps {
  section: SettingsSectionId;
  onSectionChange: (id: SettingsSectionId) => void;
}

/** Bottom nav for settings — same glass language as app MobileDock */
export function SettingsMobileDock({
  section,
  onSectionChange,
}: SettingsMobileDockProps) {
  return (
    <MobileDockShell hiddenAbove="lg">
      <MobileDockPill aria-label="أقسام الإعدادات">
        <MobileDockItem
          href={APP_BASE}
          icon={LayoutGrid}
          label="الرئيسية"
          isActive={false}
        />
        {SECTION_ITEMS.map((item) => (
          <MobileDockItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={section === item.id}
            onClick={() => onSectionChange(item.id)}
          />
        ))}
      </MobileDockPill>
    </MobileDockShell>
  );
}
