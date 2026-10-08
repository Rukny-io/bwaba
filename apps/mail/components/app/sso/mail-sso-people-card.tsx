"use client";

import { MoreHorizontal } from "lucide-react";
import { Chip, Dropdown, EmptyState } from "@heroui/react";
import type { MailSsoLinkStatus, MailSsoPerson } from "@/lib/mail-sso-client";

const LINK_STATUS: Record<
  MailSsoLinkStatus,
  { label: string; color: "default" | "success" | "warning" | "danger" }
> = {
  sent: { label: "Link sent", color: "warning" },
  used: { label: "Signed in", color: "success" },
  expired: { label: "Link expired", color: "danger" },
  revoked: { label: "Link revoked", color: "default" },
};

function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export type MailSsoPersonAction = "send" | "resend" | "copy" | "revoke";

export function MailSsoPeopleCard({
  people,
  canManage,
  busyKey,
  onAction,
}: {
  people: MailSsoPerson[];
  canManage: boolean;
  busyKey: string | null;
  onAction: (person: MailSsoPerson, action: MailSsoPersonAction) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-4 py-4 md:px-6">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
            Sign-in status
          </h2>
          <p className="mt-0.5 text-[13px] text-[var(--muted-foreground)]">
            Who has a mailbox, and whether they used their link.
          </p>
        </div>
        <p className="text-[12px] tabular-nums text-[var(--muted-foreground)]">
          {people.length} total
        </p>
      </div>

      {people.length === 0 ? (
        <EmptyState className="px-4 py-10">
          <p className="text-sm text-[var(--muted-foreground)]">No teammates yet.</p>
        </EmptyState>
      ) : (
        <ul className="divide-y divide-[color-mix(in_srgb,var(--foreground)_6%,transparent)]">
          {people.map((person) => {
            const link = person.link;
            const status = link ? LINK_STATUS[link.status] : null;
            const isOwner = person.kind === "owner";
            const lastActivity =
              link?.status === "used"
                ? `Signed in ${formatDate(link.usedAt)}`
                : person.joinedAt
                  ? `Joined ${formatDate(person.joinedAt)}`
                  : link
                    ? `Sent ${formatDate(link.lastSentAt)}`
                    : null;
            const canResend = Boolean(link && link.status !== "used");
            const canSend = !isOwner && (!link || link.status === "used");

            return (
              <li
                key={person.key}
                className="flex min-w-0 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 md:px-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                      {person.name || person.email}
                    </p>
                    <Chip size="sm" variant="soft">
                      {roleLabel(person.role)}
                    </Chip>
                    {person.kind === "email_invite" ? (
                      <Chip size="sm" variant="soft" color="warning">
                        Needs account
                      </Chip>
                    ) : person.status === "PENDING" ? (
                      <Chip size="sm" variant="soft" color="warning">
                        Pending
                      </Chip>
                    ) : null}
                  </div>
                  <p className="truncate text-[13px] text-[var(--muted-foreground)]" dir="ltr">
                    {person.email}
                    {lastActivity ? ` · ${lastActivity}` : ""}
                  </p>
                  <p className="mt-1 truncate text-[12px] text-[var(--muted-foreground)]" dir="ltr">
                    {person.mailboxes.length
                      ? person.mailboxes
                          .map((box) => (box.pending ? `${box.address} (reserved)` : box.address))
                          .join(" · ")
                      : "No mailbox"}
                  </p>
                </div>

                <div className="flex min-w-0 items-center gap-2 sm:justify-end">
                  {status ? (
                    <Chip size="sm" variant="soft" color={status.color}>
                      {status.label}
                    </Chip>
                  ) : null}
                  {canManage && !isOwner ? (
                    <Dropdown>
                      <Dropdown.Trigger
                        aria-label={`Sign-in actions for ${person.email}`}
                        isDisabled={busyKey !== null}
                        className="inline-flex size-9 items-center justify-center rounded-full text-[var(--muted-foreground)] outline-none transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                      >
                        <MoreHorizontal className="size-4" aria-hidden />
                      </Dropdown.Trigger>
                      <Dropdown.Popover
                        placement="bottom end"
                        className="min-w-[11rem] overflow-hidden rounded-2xl"
                      >
                        <Dropdown.Menu
                          onAction={(key) => onAction(person, String(key) as MailSsoPersonAction)}
                        >
                          <Dropdown.Section>
                            {canSend ? (
                              <Dropdown.Item id="send" textValue="Send sign-in link">
                                Send sign-in link
                              </Dropdown.Item>
                            ) : null}
                            {canResend ? (
                              <Dropdown.Item id="resend" textValue="Resend link">
                                Resend link
                              </Dropdown.Item>
                            ) : null}
                            {canResend ? (
                              <Dropdown.Item id="copy" textValue="Copy new link">
                                Copy new link
                              </Dropdown.Item>
                            ) : null}
                            {link?.status === "sent" ? (
                              <Dropdown.Item id="revoke" textValue="Revoke link" variant="danger">
                                Revoke link
                              </Dropdown.Item>
                            ) : null}
                          </Dropdown.Section>
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
