'use client';

import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher';
import type { AccessibleWorkspace } from '@/lib/workspace';
import { useTranslations } from '@/components/providers/translations-provider';

interface AppsWorkspaceBarProps {
  workspaces: AccessibleWorkspace[];
  currentUserId: string;
}

export function AppsWorkspaceBar({
  workspaces,
  currentUserId,
}: AppsWorkspaceBarProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-center gap-2 pt-2 sm:flex-row sm:justify-center">
      <span className="text-xs text-[var(--muted-foreground)]">
        {t.workspace?.viewingLabel ?? 'مساحة العمل'}:
      </span>
      <WorkspaceSwitcher
        workspaces={workspaces}
        currentUserId={currentUserId}
      />
    </div>
  );
}
