'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  readActiveWorkspaceIdFromBrowser,
  writeActiveWorkspaceIdInBrowser,
  type AccessibleWorkspace,
} from '@/lib/workspace';
import { markWorkspaceSwitched } from '@/components/app/workspace-switch-toast';

interface WorkspaceSwitcherProps {
  workspaces: AccessibleWorkspace[];
  currentUserId: string;
  className?: string;
}

const ROLE_LABELS_AR: Record<AccessibleWorkspace['role'], string> = {
  OWNER: 'المالك',
  ADMIN: 'مشرف',
  MANAGER: 'مدير',
  DEVELOPER: 'مطوّر',
  SUPPORT: 'دعم',
  VIEWER: 'مشاهد',
};

function workspaceLabel(ws: AccessibleWorkspace): string {
  return (
    ws.owner.profile?.name ||
    ws.owner.profile?.username ||
    ws.owner.email ||
    ws.id
  );
}

export function WorkspaceSwitcher({
  workspaces,
  currentUserId,
  className,
}: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(currentUserId);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = readActiveWorkspaceIdFromBrowser();
    if (stored && workspaces.some((w) => w.id === stored)) {
      setActiveId(stored);
    } else {
      setActiveId(currentUserId);
      if (stored) writeActiveWorkspaceIdInBrowser(null);
    }
  }, [currentUserId, workspaces]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = useMemo(
    () => workspaces.find((w) => w.id === activeId) ?? workspaces[0],
    [workspaces, activeId],
  );

  if (!current || workspaces.length < 2) return null;

  const CurrentIcon = current.isOwner ? User : Building2;

  const handleSelect = (id: string) => {
    if (id === activeId) {
      setOpen(false);
      return;
    }
    const target = workspaces.find((w) => w.id === id);
    if (!target) return;
    if (target.isOwner) {
      writeActiveWorkspaceIdInBrowser(null);
    } else {
      writeActiveWorkspaceIdInBrowser(target.id);
    }
    markWorkspaceSwitched(workspaceLabel(target));
    setActiveId(id);
    setOpen(false);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 items-center gap-1.5 rounded-full border border-transparent px-2.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors sm:text-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <CurrentIcon className="size-4 shrink-0" />
        <span className="max-w-[8rem] truncate">
          {workspaceLabel(current)}
        </span>
        <ChevronDown className="size-3.5 shrink-0" />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute end-0 mt-2 min-w-[15rem] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg z-30"
        >
          {workspaces.map((ws) => {
            const isCurrent = ws.id === activeId;
            const Icon = ws.isOwner ? User : Building2;
            return (
              <button
                type="button"
                key={ws.id}
                role="option"
                aria-selected={isCurrent}
                onClick={() => handleSelect(ws.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-start transition-colors',
                  isCurrent
                    ? 'bg-[var(--surface-secondary)]'
                    : 'hover:bg-[var(--surface-secondary)]',
                )}
              >
                <Icon className="size-4 shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {workspaceLabel(ws)}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {ROLE_LABELS_AR[ws.role] ?? ws.role}
                  </span>
                </div>
                {isCurrent && (
                  <Check className="size-4 shrink-0 text-[var(--primary)]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
