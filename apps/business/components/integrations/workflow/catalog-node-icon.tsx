'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  Clock,
  GitBranch,
  Instagram,
  MessageCircle,
  Send,
  StickyNote,
  Webhook,
} from 'lucide-react';
import type { WorkflowNodeCatalogItem } from '@/lib/workflows/types';

const ICONS: Record<WorkflowNodeCatalogItem['iconId'], LucideIcon> = {
  instagram: Instagram,
  messenger: MessageCircle,
  webhook: Webhook,
  ai: Bot,
  send: Send,
  delay: Clock,
  condition: GitBranch,
  note: StickyNote,
};

export function CatalogNodeIcon({
  iconId,
  className,
  size = 16,
}: {
  iconId: WorkflowNodeCatalogItem['iconId'];
  className?: string;
  size?: number;
}) {
  const Icon = ICONS[iconId];
  return <Icon className={className} size={size} strokeWidth={1.8} aria-hidden />;
}
