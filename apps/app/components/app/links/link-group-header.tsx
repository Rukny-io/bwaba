'use client';

import { useState } from 'react';
import { ChevronDown, Folder, Pencil, Trash2 } from 'lucide-react';
import { Popover } from '@heroui/react';
import { linksPressableClass, linksToolBtnClass } from '@/components/app/links/links-interaction';
import type { LinkGroup } from '@/lib/links/types';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
];

interface LinkGroupHeaderProps {
  group: LinkGroup;
  expanded: boolean;
  linkCount: number;
  busy?: boolean;
  onToggleExpanded: () => void;
  onRename: (name: string) => Promise<void>;
  onChangeColor?: (color: string) => Promise<void>;
  onDelete: () => void;
}

export function LinkGroupHeader({
  group,
  expanded,
  linkCount,
  busy = false,
  onToggleExpanded,
  onRename,
  onChangeColor,
  onDelete,
}: LinkGroupHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.nameAr || group.name);

  async function commitRename() {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed === (group.nameAr || group.name)) {
      setEditing(false);
      setName(group.nameAr || group.name);
      return;
    }
    await onRename(trimmed);
    setEditing(false);
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 sm:gap-2 sm:px-3 sm:py-2.5',
        busy && 'pointer-events-none opacity-70',
      )}
    >
      {onChangeColor ? (
        <Popover>
          <Popover.Trigger>
            <button
              type="button"
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full text-white sm:size-8',
                linksPressableClass,
                'active:brightness-95',
              )}
              style={{ backgroundColor: group.color || '#6366f1' }}
              title="تغيير اللون"
              disabled={busy}
              aria-label="تغيير لون المجموعة"
            >
              <Folder className="size-3.5" />
            </button>
          </Popover.Trigger>
          <Popover.Content placement="bottom start" className="w-auto">
            <Popover.Dialog className="flex flex-wrap gap-2 p-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => void onChangeColor(preset)}
                  className={cn(
                    'size-8 rounded-full ring-offset-2 ring-offset-[var(--surface)] sm:size-7',
                    linksPressableClass,
                    'active:ring-2 active:ring-[var(--foreground)]/30',
                    (group.color || '#6366f1') === preset &&
                      'ring-2 ring-[var(--foreground)]',
                  )}
                  style={{ backgroundColor: preset }}
                  aria-label={`لون ${preset}`}
                />
              ))}
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      ) : (
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: group.color || '#6366f1' }}
          aria-hidden
        >
          <Folder className="size-3.5" />
        </span>
      )}

      <button
        type="button"
        onClick={onToggleExpanded}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2 rounded-xl px-1 py-0.5 text-start -mx-1',
          linksPressableClass,
        )}
        disabled={busy}
      >
        {editing ? (
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void commitRename();
              }
              if (event.key === 'Escape') {
                setEditing(false);
                setName(group.nameAr || group.name);
              }
            }}
            onBlur={() => void commitRename()}
            autoFocus
            className="h-8 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-transparent px-2 text-sm font-semibold outline-none"
          />
        ) : (
          <span className="min-w-0 truncate text-sm font-semibold text-[var(--foreground)]">
            {group.nameAr || group.name}
          </span>
        )}
        <span className="shrink-0 rounded-md bg-[var(--surface-secondary)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)] sm:bg-transparent sm:px-0 sm:py-0 sm:text-[11px] sm:font-normal">
          {linkCount}
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-[var(--muted-foreground)] transition-transform duration-200 ease-out',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      <button
        type="button"
        className={cn(linksToolBtnClass, 'size-8 sm:size-8')}
        onClick={() => {
          setName(group.nameAr || group.name);
          setEditing(true);
        }}
        title="تعديل الاسم"
        disabled={busy}
      >
        <Pencil className="size-3.5" aria-hidden />
      </button>
      <button
        type="button"
        className={cn(
          linksToolBtnClass,
          'size-8 text-[var(--muted-foreground)] hover:text-[var(--danger)] sm:size-8',
        )}
        onClick={onDelete}
        title="حذف المجموعة"
        disabled={busy}
      >
        <Trash2 className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
