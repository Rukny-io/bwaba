"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  Clock,
  FileText,
  Inbox,
  PenSquare,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@heroui/react";

export type InboxFolderId =
  | "inbox"
  | "starred"
  | "scheduled"
  | "sent"
  | "drafts"
  | "spam"
  | "archive"
  | "trash";

const FOLDERS: {
  id: InboxFolderId;
  label: string;
  icon: typeof Inbox;
}[] = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "starred", label: "Favorites", icon: Star },
  { id: "scheduled", label: "Snoozed", icon: Clock },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: FileText },
  { id: "spam", label: "Spam", icon: AlertTriangle },
  { id: "archive", label: "Archive", icon: Archive },
  { id: "trash", label: "Trash", icon: Trash2 },
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
    <aside className="flex h-full w-[200px] shrink-0 flex-col gap-4 md:w-[220px]">
      <button
        type="button"
        onClick={onCompose}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] transition-[transform,opacity] duration-200 hover:opacity-95 active:scale-[0.98]"
      >
        <PenSquare className="size-4" aria-hidden />
        Compose
      </button>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-0.5" aria-label="Mail folders">
        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
          Folders
        </p>
        {FOLDERS.map((item) => {
          const Icon = item.icon;
          const active = folder === item.id;
          const count = counts[item.id] ?? 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onFolderChange(item.id)}
              className={cn(
                "flex h-10 w-full items-center gap-2.5 rounded-full px-3 text-sm font-medium transition-colors duration-150",
                active
                  ? "bg-[var(--brand-blue-soft)] text-[var(--secondary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-white/80 hover:text-[var(--foreground)] dark:hover:bg-[var(--surface)]",
              )}
            >
              <Icon
                className="size-4 shrink-0"
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
      </nav>
      {mailboxSwitcher ? (
        <div className="mt-auto shrink-0 pt-2">{mailboxSwitcher}</div>
      ) : null}
    </aside>
  );
}
