'use client';

import { Bot, Inbox, Instagram, MessageCircle, Settings, Workflow } from 'lucide-react';
import type { SidebarIconId } from '@/components/layout/nav-config';

const LUCIDE_ICONS = {
  inbox: Inbox,
  settings: Settings,
  ai: Bot,
  workflows: Workflow,
  instagram: Instagram,
  messenger: MessageCircle,
} as const;

export function SidebarIcon({
  iconId,
  isActive,
  size = 19,
}: {
  iconId: SidebarIconId;
  isActive: boolean;
  size?: number;
}) {
  const Icon = LUCIDE_ICONS[iconId];
  if (!Icon) return null;

  return (
    <Icon size={size} strokeWidth={isActive ? 2 : 1.7} aria-hidden />
  );
}
