"use client";

import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  ChevronDown,
  Clock,
  FileText,
  Inbox,
  Mail,
  PenSquare,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import { cn, Dropdown } from "@heroui/react";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import type { MailMailboxView } from "@/lib/mail-mailboxes-client";

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
  mailboxes: MailMailboxView[];
  selectedMailboxId: string | null;
  onSelectMailbox: (id: string) => void;
  folder: InboxFolderId;
  onFolderChange: (id: InboxFolderId) => void;
  counts: Record<InboxFolderId, number>;
  onCompose: () => void;
};

export function MailInboxSidebar({
  mailboxes,
  selectedMailboxId,
  onSelectMailbox,
  folder,
  onFolderChange,
  counts,
  onCompose,
}: Props) {
  const pathname = usePathname();
  const slot = parseMailSlot(pathname);
  const href = (path: string) => withMailSlot(path, slot);
  const selected = mailboxes.find((m) => m.id === selectedMailboxId) ?? null;

  return (
    <aside className="flex h-full w-[200px] shrink-0 flex-col gap-3 md:w-[220px]">
      <Dropdown>
        <Dropdown.Trigger className="flex w-full items-center gap-2 rounded-2xl border border-[var(--border)]/70 bg-[var(--surface)] px-2.5 py-2 text-left outline-none">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <Mail className="size-3.5" />
          </span>
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--foreground)]">
            {selected?.address ?? "Select mailbox"}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-[var(--muted-foreground)]" />
        </Dropdown.Trigger>
        <Dropdown.Popover placement="bottom start" className="min-w-[16rem] overflow-hidden rounded-2xl">
          <Dropdown.Menu
            onAction={(key) => {
              const id = String(key);
              if (id === "manage") return;
              onSelectMailbox(id);
            }}
          >
            {mailboxes.map((box) => (
              <Dropdown.Item key={box.id} id={box.id} textValue={box.address}>
                {box.address}
              </Dropdown.Item>
            ))}
            {mailboxes.length === 0 ? (
              <Dropdown.Item id="none" textValue="No mailboxes" isDisabled>
                No mailboxes yet
              </Dropdown.Item>
            ) : null}
            <Dropdown.Item id="manage" textValue="Manage mailboxes" href={href("/app")}>
              Manage mailboxes
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <button
        type="button"
        onClick={onCompose}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-95"
      >
        <PenSquare className="size-4" aria-hidden />
        Compose
      </button>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-0.5" aria-label="Mail folders">
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
                "flex h-10 w-full items-center gap-2.5 rounded-full px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--brand-blue-soft)] text-[var(--secondary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
              <span className="flex-1 text-left">{item.label}</span>
              {count > 0 ? (
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums",
                    active
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "text-[var(--muted-foreground)]",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}

      </nav>
    </aside>
  );
}
