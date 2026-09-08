"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  FileText,
  Inbox,
  Megaphone,
  PenSquare,
  Send,
  Star,
  Trash2,
  UsersRound,
} from "lucide-react";
import { cn } from "@heroui/react";

export type InboxFolderId =
  | "inbox"
  | "starred"
  | "scheduled"
  | "sent"
  | "drafts"
  | "promotions"
  | "social"
  | "spam"
  | "archive"
  | "trash";

type FolderItem = {
  id: InboxFolderId;
  label: string;
  icon: typeof Inbox;
};

const FOLDER_GROUPS: { label: string; items: FolderItem[] }[] = [
  {
    label: "Mail",
    items: [
      { id: "inbox", label: "Inbox", icon: Inbox },
      { id: "starred", label: "Favorites", icon: Star },
      { id: "sent", label: "Sent", icon: Send },
      { id: "drafts", label: "Drafts", icon: FileText },
    ],
  },
  {
    label: "Organize",
    items: [
      { id: "promotions", label: "Promotions", icon: Megaphone },
      { id: "social", label: "Social", icon: UsersRound },
      { id: "spam", label: "Spam", icon: AlertTriangle },
      { id: "archive", label: "Archive", icon: Archive },
      { id: "trash", label: "Trash", icon: Trash2 },
    ],
  },
];

type Props = {
  folder: InboxFolderId;
  onFolderChange: (id: InboxFolderId) => void;
  counts: Record<InboxFolderId, number>;
  onCompose: () => void;
  mailboxSwitcher?: ReactNode;
};

export function MailInboxSidebar({
  folder,
  onFolderChange,
  counts,
  onCompose,
  mailboxSwitcher,
}: Props) {
  return (
    <aside className="flex h-full w-[200px] shrink-0 flex-col border-r border-[var(--separator)] bg-[var(--surface)] px-3 py-4 md:w-[220px]">
      <button
        type="button"
        onClick={onCompose}
        className="inline-flex h-11 w-full items-center justify-start gap-2.5 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition-[transform,opacity] duration-200 hover:opacity-95 active:scale-[0.98]"
      >
        <PenSquare className="size-4" aria-hidden />
        Compose
      </button>

      <nav className="mt-5 flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain scrollbar-none px-0.5" aria-label="Mail folders">
        {FOLDER_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = folder === item.id;
                const count = counts[item.id] ?? 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onFolderChange(item.id)}
                    className={cn(
                      "relative flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
                      active
                        ? "bg-[var(--surface-secondary)] text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)]/70 hover:text-[var(--foreground)]",
                    )}
                  >
                    {active ? (
                      <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[var(--primary)]" />
                    ) : null}
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        active && "text-[var(--primary)]",
                      )}
                      strokeWidth={active ? 2.25 : 1.75}
                      aria-hidden
                    />
                    <span className="flex-1 text-left">{item.label}</span>
                    {count > 0 ? (
                      <span
                        className={cn(
                          "min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums",
                          active
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "bg-[var(--surface-secondary)] text-[var(--muted-foreground)]",
                        )}
                      >
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      {mailboxSwitcher ? (
        <div className="mt-auto shrink-0 border-t border-[var(--separator)] pt-3">
          {mailboxSwitcher}
        </div>
      ) : null}
    </aside>
  );
}
