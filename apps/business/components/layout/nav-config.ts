import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  Inbox,
  Instagram,
  LayoutGrid,
  MessageCircle,
  Settings,
  Workflow,
} from 'lucide-react';
import { APP_BASE, isNavItemActive } from '@/lib/business-routes';

export type CommandPaletteItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
  exact?: boolean;
};

export type CommandPaletteSection = {
  id: string;
  label: string;
  items: CommandPaletteItem[];
};

export const commandPaletteSections: CommandPaletteSection[] = [
  {
    id: 'general',
    label: 'عام',
    items: [
      {
        href: APP_BASE,
        icon: LayoutGrid,
        label: 'لوحة التحكم',
        description: 'ملخص القنوات والنشاط',
        exact: true,
      },
      {
        href: `${APP_BASE}/settings`,
        icon: Settings,
        label: 'الإعدادات',
        description: 'الحساب والمظهر والإشعارات',
      },
    ],
  },
  {
    id: 'workspace',
    label: 'مساحة العمل',
    items: [
      {
        href: `${APP_BASE}/inbox`,
        icon: Inbox,
        label: 'صندوق الوارد',
        description: 'محادثات Instagram و Messenger',
        exact: true,
      },
      {
        href: `${APP_BASE}/ai`,
        icon: Bot,
        label: 'الذكاء الاصطناعي',
        description: 'مساعد المحادثات والردود',
        exact: true,
      },
      {
        href: `${APP_BASE}/workflows`,
        icon: Workflow,
        label: 'Workflows',
        description: 'أتمتة الردود والتكاملات',
        exact: true,
      },
      {
        href: `${APP_BASE}/instagram`,
        icon: Instagram,
        label: 'Instagram',
        description: 'ربط الحسابات وإدارة القناة',
      },
      {
        href: `${APP_BASE}/messenger`,
        icon: MessageCircle,
        label: 'Messenger',
        description: 'رسائل صفحة Facebook',
      },
    ],
  },
];

export type SidebarIconId =
  | 'inbox'
  | 'settings'
  | 'ai'
  | 'workflows'
  | 'instagram'
  | 'messenger';

export type NavItem = {
  href: string;
  iconId: SidebarIconId;
  label: string;
  exact?: boolean;
};

export function getPrimaryNavItems(): NavItem[] {
  return [
    {
      href: `${APP_BASE}/inbox`,
      iconId: 'inbox',
      label: 'صندوق الوارد',
      exact: true,
    },
    {
      href: `${APP_BASE}/settings`,
      iconId: 'settings',
      label: 'الإعدادات',
      exact: true,
    },
    {
      href: `${APP_BASE}/ai`,
      iconId: 'ai',
      label: 'الذكاء الاصطناعي',
      exact: true,
    },
    {
      href: `${APP_BASE}/workflows`,
      iconId: 'workflows',
      label: 'Workflows',
      exact: true,
    },
  ];
}

export function getChannelNavItems(): NavItem[] {
  return [
    { href: `${APP_BASE}/instagram`, iconId: 'instagram', label: 'Instagram' },
    { href: `${APP_BASE}/messenger`, iconId: 'messenger', label: 'Messenger' },
  ];
}

export function getAllNavItems(): NavItem[] {
  return [...getPrimaryNavItems(), ...getChannelNavItems()];
}

export function getMobileDockItems(): NavItem[] {
  return getAllNavItems();
}

export { isNavItemActive };
