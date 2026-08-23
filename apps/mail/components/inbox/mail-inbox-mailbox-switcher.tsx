"use client";

import { Check, ChevronDown } from "lucide-react";
import { cn, Dropdown } from "@heroui/react";
import type { MailMailboxView } from "@/lib/mail-mailboxes-client";
import { MailPersonAvatar } from "@/components/inbox/mail-person-avatar";

type Props = {
  mailboxes: MailMailboxView[];
  selectedId: string | null;
  disabled?: boolean;
  variant?: "header" | "sidebar";
  onSelect: (mailboxId: string) => void;
  onLock: () => void;
};

export function MailInboxMailboxSwitcher({
  mailboxes,
  selectedId,
  disabled = false,
  variant = "header",
  onSelect,
  onLock,
}: Props) {
  const active = mailboxes.filter((box) => box.status === "ACTIVE");
  const selected = active.find((box) => box.id === selectedId) ?? null;
  const isSidebar = variant === "sidebar";

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="Switch mailbox"
        isDisabled={disabled}
        className={cn(
          "outline-none disabled:opacity-60",
          isSidebar
            ? "flex w-full items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-left hover:bg-[var(--surface-secondary)]"
            : "flex items-center gap-2 rounded-full p-0.5 pe-2.5 hover:bg-[var(--surface-secondary)]",
        )}
      >
        <MailPersonAvatar
          name={selected?.displayName || selected?.localPart || "RM"}
          email={selected?.address}
          avatarUrl={selected?.avatarUrl}
          className="size-9"
          textClassName="text-xs"
        />
        <span className={cn("min-w-0 flex-1", isSidebar ? "block" : "hidden md:block")}>
          <span className="block truncate text-[13px] font-semibold text-[var(--foreground)]">
            {selected?.displayName || selected?.localPart || "Mailbox"}
          </span>
          <span className="block truncate text-[11px] text-[var(--muted-foreground)]">
            {selected?.address || "Select a mailbox"}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-[var(--muted-foreground)]",
            isSidebar ? "block" : "hidden md:block",
          )}
          aria-hidden
        />
      </Dropdown.Trigger>
      <Dropdown.Popover
        placement={isSidebar ? "top start" : "bottom end"}
        className="min-w-[18rem] overflow-hidden rounded-2xl"
      >
        <Dropdown.Menu
          onAction={(key) => {
            const value = String(key);
            if (value === "lock") {
              onLock();
              return;
            }
            if (value.startsWith("mailbox:") && !disabled) {
              const id = value.slice("mailbox:".length);
              if (id && id !== selectedId) onSelect(id);
            }
          }}
        >
          {active.map((box) => {
            const current = box.id === selectedId;
            return (
              <Dropdown.Item
                key={box.id}
                id={`mailbox:${box.id}`}
                textValue={box.address}
              >
                <span className="flex w-full items-center gap-2.5 py-0.5">
                  <MailPersonAvatar
                    name={box.displayName || box.localPart}
                    email={box.address}
                    avatarUrl={box.avatarUrl}
                    className="size-8"
                    textClassName="text-[10px]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-[var(--foreground)]">
                      {box.displayName || box.localPart}
                    </span>
                    <span className="block truncate text-[11px] text-[var(--muted-foreground)]">
                      {box.address}
                    </span>
                  </span>
                  {current ? (
                    <Check className="size-4 shrink-0 text-[var(--primary)]" aria-hidden />
                  ) : null}
                </span>
              </Dropdown.Item>
            );
          })}
          <Dropdown.Item id="lock" textValue="Sign out of mailbox">
            Sign out of mailbox
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
