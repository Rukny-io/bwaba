'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Check, ChevronDown, User } from 'lucide-react';
import { Dropdown } from '@heroui/react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/components/providers/translations-provider';
import {
  readActiveWorkspaceIdFromBrowser,
  writeActiveWorkspaceIdInBrowser,
  type AccessibleWorkspace,
} from '@/lib/workspace';
import { markWorkspaceSwitched } from '@/components/workspace/workspace-switch-toast';

interface WorkspaceSwitcherProps {
  workspaces: AccessibleWorkspace[];
  currentUserId: string;
}

function workspaceLabel(ws: AccessibleWorkspace): string {
  return (
    ws.owner.profile?.name ||
    ws.owner.profile?.username ||
    ws.owner.email ||
    ws.id
  );
}

function roleLabelKey(role: AccessibleWorkspace['role']): string {
  return role.toLowerCase();
}

export function WorkspaceSwitcher({
  workspaces,
  currentUserId,
}: WorkspaceSwitcherProps) {
  const t = useTranslations();
  const [activeId, setActiveId] = useState<string>(currentUserId);

  useEffect(() => {
    const stored = readActiveWorkspaceIdFromBrowser();
    if (stored && workspaces.some((w) => w.id === stored)) {
      setActiveId(stored);
    } else {
      setActiveId(currentUserId);
      writeActiveWorkspaceIdInBrowser(null);
    }
  }, [currentUserId, workspaces]);

  const current = useMemo(
    () => workspaces.find((w) => w.id === activeId) ?? workspaces[0],
    [workspaces, activeId],
  );

  const hasMultiple = workspaces.length > 1;

  const handleSelect = (id: string) => {
    if (id === activeId) return;
    const target = workspaces.find((w) => w.id === id);
    if (!target) return;
    if (target.isOwner) {
      writeActiveWorkspaceIdInBrowser(null);
    } else {
      writeActiveWorkspaceIdInBrowser(target.id);
    }
    markWorkspaceSwitched(workspaceLabel(target));
    setActiveId(id);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  if (!current) return null;

  const currentIcon = current.isOwner ? User : Building2;
  const CurrentIcon = currentIcon;

  const pillClass =
    'touch-target inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] sm:px-4 outline-none';

  if (!hasMultiple) {
    return null;
  }

  return (
    <Dropdown>
      <Dropdown.Trigger className={cn(pillClass, 'max-w-[12rem] truncate')}>
        <CurrentIcon size={16} className="shrink-0" />
        <span className="truncate">{workspaceLabel(current)}</span>
        <ChevronDown size={16} className="shrink-0" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start" className="min-w-[16rem]">
        <Dropdown.Menu
          onAction={(key) => handleSelect(String(key))}
        >
          {workspaces.map((ws) => {
            const isCurrent = ws.id === activeId;
            const Icon = ws.isOwner ? User : Building2;
            const roleKey = roleLabelKey(ws.role);
            const roleLabel =
              (t.workspace?.roles as Record<string, string> | undefined)?.[roleKey] ??
              ws.role;
            return (
              <Dropdown.Item
                key={ws.id}
                id={ws.id}
                textValue={workspaceLabel(ws)}
                className="gap-2"
              >
                <Icon className="size-4 shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {workspaceLabel(ws)}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {roleLabel}
                  </span>
                </div>
                {isCurrent && <Check className="size-4 shrink-0 text-[var(--primary)]" />}
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
