"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Info, Search, Settings } from "lucide-react";
import {
  MailInboxSidebar,
  type InboxFolderId,
} from "@/components/inbox/mail-inbox-sidebar";
import {
  MailInboxListCard,
  type InboxMessageRow,
} from "@/components/inbox/mail-inbox-list-card";
import { MailInboxReaderCard } from "@/components/inbox/mail-inbox-reader-card";
import {
  MailComposeModal,
  type ComposeDraft,
} from "@/components/inbox/mail-compose-modal";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import {
  listMailMailboxes,
  type MailMailboxView,
} from "@/lib/mail-mailboxes-client";
import {
  getMailMessage,
  getMailMessageCounts,
  importInboundMailMessages,
  listMailMessages,
  sendMailMessage,
  updateMailMessage,
  type MailFolderCounts,
  type MailMessageFolderApi,
  type MailMessageView,
} from "@/lib/mail-messages-client";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";

const MAILBOX_STORAGE_KEY = "rukny_mail_selected_mailbox";

const FOLDER_TO_API: Partial<Record<InboxFolderId, MailMessageFolderApi>> = {
  inbox: "INBOX",
  sent: "SENT",
  drafts: "DRAFTS",
  spam: "SPAM",
  archive: "ARCHIVE",
  trash: "TRASH",
};

function displayName(msg: MailMessageView) {
  return msg.fromName?.trim() || msg.from?.name?.trim() || msg.fromAddress;
}

function toRow(msg: MailMessageView): InboxMessageRow {
  const when = msg.receivedAt || msg.sentAt || msg.createdAt;
  const body =
    msg.bodyText?.trim() ||
    (msg.bodyHtml
      ? msg.bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      : "") ||
    msg.preview ||
    "";
  return {
    id: msg.id,
    from: displayName(msg),
    fromEmail: msg.fromAddress,
    to: msg.to.join(", "),
    toList: msg.to,
    subject: msg.subject || "(no subject)",
    preview: msg.preview || body.slice(0, 140),
    body,
    receivedAt: when,
    unread: msg.unread,
    starred: msg.starred,
    folder: msg.folder,
  };
}

function parseEmails(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function emptyCounts(): Record<InboxFolderId, number> {
  return {
    inbox: 0,
    starred: 0,
    scheduled: 0,
    sent: 0,
    drafts: 0,
    spam: 0,
    archive: 0,
    trash: 0,
  };
}

function mapCounts(c: MailFolderCounts): Record<InboxFolderId, number> {
  return {
    inbox: c.inbox,
    starred: c.starred,
    scheduled: 0,
    sent: c.sent,
    drafts: c.drafts,
    spam: c.spam,
    archive: c.archive,
    trash: c.trash,
  };
}

function replyTarget(message: InboxMessageRow, mailboxAddress: string | null) {
  const mine = mailboxAddress?.trim().toLowerCase();
  if (mine && message.fromEmail.toLowerCase() === mine) {
    const targets =
      message.toList?.filter((e) => e.toLowerCase() !== mine) ??
      parseEmails(message.to).filter((e) => e !== mine);
    return targets[0] || message.to || message.fromEmail;
  }
  return message.fromEmail;
}

export function MailInboxShell() {
  const pathname = usePathname();
  const slot = parseMailSlot(pathname);
  const appHref = withMailSlot("/app", slot);
  const settingsHref = withMailSlot("/settings", slot);

  const [appId, setAppId] = useState<string | null>(null);
  const [mailboxes, setMailboxes] = useState<MailMailboxView[]>([]);
  const [selectedMailboxId, setSelectedMailboxId] = useState<string | null>(
    null,
  );
  const [folder, setFolder] = useState<InboxFolderId>("inbox");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<InboxMessageRow[]>([]);
  const [counts, setCounts] = useState<Record<InboxFolderId, number>>(
    emptyCounts,
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [mobileShowReader, setMobileShowReader] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeInitial, setComposeInitial] = useState<ComposeDraft | null>(
    null,
  );
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replySending, setReplySending] = useState(false);

  const selected = mailboxes.find((m) => m.id === selectedMailboxId) ?? null;

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }, []);

  const loadCounts = useCallback(
    async (id: string, mailboxId: string | null) => {
      try {
        const next = await getMailMessageCounts(id, mailboxId ?? undefined);
        setCounts(mapCounts(next));
      } catch {
        /* keep previous counts */
      }
    },
    [],
  );

  const loadMessages = useCallback(
    async (
      id: string,
      mailboxId: string | null,
      folderId: InboxFolderId,
      opts?: { quiet?: boolean },
    ) => {
      if (!mailboxId) {
        setMessages([]);
        return;
      }
      if (folderId === "scheduled") {
        setMessages([]);
        return;
      }
      if (!opts?.quiet) setMessagesLoading(true);
      try {
        const result =
          folderId === "starred"
            ? await listMailMessages(id, {
                mailboxId,
                starred: true,
                take: 100,
              })
            : await listMailMessages(id, {
                mailboxId,
                folder: FOLDER_TO_API[folderId] ?? "INBOX",
                take: 100,
              });
        setMessages(result.messages.map(toRow));
        setError("");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load messages.",
        );
        setMessages([]);
      } finally {
        if (!opts?.quiet) setMessagesLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = readMailAppIdFromDocument();
      if (!id) {
        if (!cancelled) {
          setError("Open a Mail app first.");
          setLoading(false);
        }
        return;
      }
      setAppId(id);
      try {
        const boxes = await listMailMailboxes(id);
        if (cancelled) return;
        setMailboxes(boxes);
        const stored =
          typeof window !== "undefined"
            ? window.localStorage.getItem(MAILBOX_STORAGE_KEY)
            : null;
        const initial =
          (stored && boxes.some((b) => b.id === stored) ? stored : null) ||
          boxes[0]?.id ||
          null;
        setSelectedMailboxId(initial);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load mailboxes.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!appId || !selectedMailboxId) {
      setMessages([]);
      setCounts(emptyCounts());
      return;
    }
    void loadMessages(appId, selectedMailboxId, folder);
    void loadCounts(appId, selectedMailboxId);
  }, [appId, selectedMailboxId, folder, loadMessages, loadCounts]);

  // Catch-up: if Inbox is empty but SES already wrote to S3, import once.
  useEffect(() => {
    if (!appId || !selectedMailboxId || folder !== "inbox") return;
    if (messagesLoading || messages.length > 0) return;
    let cancelled = false;
    const key = `rukny_mail_auto_import_${appId}_${selectedMailboxId}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(key)) return;
    (async () => {
      try {
        if (typeof window !== "undefined") sessionStorage.setItem(key, "1");
        const result = await importInboundMailMessages(appId, 40);
        if (cancelled) return;
        const stored = result.results.filter(
          (r) => r.handled === "stored_inbound",
        ).length;
        if (stored > 0) {
          await loadMessages(appId, selectedMailboxId, "inbox", {
            quiet: true,
          });
          await loadCounts(appId, selectedMailboxId);
          showToast(`Imported ${stored} inbound message${stored === 1 ? "" : "s"}`);
        }
      } catch {
        /* IAM/API not ready yet */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    appId,
    selectedMailboxId,
    folder,
    messagesLoading,
    messages.length,
    loadMessages,
    loadCounts,
    showToast,
  ]);

  const selectMailbox = useCallback((id: string) => {
    if (id === "manage" || id === "none") return;
    setSelectedMailboxId(id);
    setSelectedMessageId(null);
    setMobileShowReader(false);
    setReplyBody("");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MAILBOX_STORAGE_KEY, id);
    }
  }, []);

  const visibleMessages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) =>
        m.from.toLowerCase().includes(q) ||
        m.fromEmail.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.preview.toLowerCase().includes(q),
    );
  }, [messages, search]);

  const selectedMessage =
    visibleMessages.find((m) => m.id === selectedMessageId) ?? null;
  const selectedIndex = selectedMessage
    ? visibleMessages.findIndex((m) => m.id === selectedMessage.id)
    : -1;

  function openCompose(draft?: ComposeDraft | null) {
    setSendError("");
    setComposeInitial(draft ?? null);
    setComposeOpen(true);
  }

  function onCompose() {
    openCompose(null);
  }

  function onReply(message: InboxMessageRow) {
    const subject = message.subject.startsWith("Re:")
      ? message.subject
      : `Re: ${message.subject}`;
    openCompose({
      to: replyTarget(message, selected?.address ?? null),
      subject,
      body: "",
      replyToMessageId: message.id,
    });
  }

  function onForward(message: InboxMessageRow) {
    openCompose({
      to: "",
      subject: message.subject.startsWith("Fwd:")
        ? message.subject
        : `Fwd: ${message.subject}`,
      body: `\n\n---------- Forwarded message ----------\nFrom: ${message.from} <${message.fromEmail}>\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.body}`,
    });
  }

  async function handleSend(draft: ComposeDraft) {
    if (!appId || !selectedMailboxId) {
      setSendError("Select a mailbox first.");
      return;
    }
    setSending(true);
    setSendError("");
    try {
      await sendMailMessage(appId, {
        mailboxId: selectedMailboxId,
        to: parseEmails(draft.to),
        cc: draft.cc ? parseEmails(draft.cc) : undefined,
        subject: draft.subject,
        bodyText: draft.body,
        replyToMessageId: draft.replyToMessageId,
      });
      setComposeOpen(false);
      showToast("Message sent");
      await loadMessages(appId, selectedMailboxId, folder, { quiet: true });
      await loadCounts(appId, selectedMailboxId);
      if (folder !== "sent") {
        setFolder("sent");
        setSelectedMessageId(null);
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Send failed.");
    } finally {
      setSending(false);
    }
  }

  async function handleRefresh() {
    if (!appId || !selectedMailboxId) return;
    setRefreshing(true);
    try {
      await Promise.all([
        loadMessages(appId, selectedMailboxId, folder, { quiet: true }),
        loadCounts(appId, selectedMailboxId),
      ]);
      showToast("Inbox updated");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleImportInbound() {
    if (!appId || !selectedMailboxId) return;
    setImporting(true);
    try {
      const result = await importInboundMailMessages(appId, 40);
      const stored = result.results.filter(
        (r) => r.handled === "stored_inbound",
      ).length;
      const unmatched = result.results.filter(
        (r) => r.handled === "no_matching_mailbox",
      ).length;
      const failed = result.results.filter(
        (r) => r.handled === "error" || r.handled === "s3_not_found",
      ).length;
      await Promise.all([
        loadMessages(appId, selectedMailboxId, folder, { quiet: true }),
        loadCounts(appId, selectedMailboxId),
      ]);
      if (stored > 0) {
        showToast(`Imported ${stored} message${stored === 1 ? "" : "s"}`);
      } else if (unmatched > 0) {
        showToast("Found mail in S3 but no matching mailbox");
      } else if (failed > 0) {
        showToast("Could not read S3 mail — check IAM GetObject permission");
      } else {
        showToast("No new inbound mail to import");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  async function onSelectMessage(id: string) {
    setSelectedMessageId(id);
    setMobileShowReader(true);
    setReplyBody("");
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, unread: false } : m)),
    );
    if (!appId) return;
    try {
      const full = await getMailMessage(appId, id);
      const row = toRow(full);
      setMessages((prev) => prev.map((m) => (m.id === id ? row : m)));
      void loadCounts(appId, selectedMailboxId);
    } catch {
      /* list preview is enough */
    }
  }

  async function onToggleStar(message: InboxMessageRow) {
    if (!appId) return;
    const next = !message.starred;
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, starred: next } : m)),
    );
    try {
      await updateMailMessage(appId, message.id, { isStarred: next });
      await loadCounts(appId, selectedMailboxId);
      if (folder === "starred" && !next) {
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
        if (selectedMessageId === message.id) {
          setSelectedMessageId(null);
          setMobileShowReader(false);
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, starred: message.starred } : m,
        ),
      );
      showToast(err instanceof Error ? err.message : "Could not update star.");
    }
  }

  async function onTrash(message: InboxMessageRow) {
    if (!appId) return;
    try {
      await updateMailMessage(appId, message.id, { folder: "TRASH" });
      setMessages((prev) => prev.filter((m) => m.id !== message.id));
      if (selectedMessageId === message.id) {
        setSelectedMessageId(null);
        setMobileShowReader(false);
      }
      await loadCounts(appId, selectedMailboxId);
      showToast("Moved to Trash");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not move message.");
    }
  }

  async function onSendReply(message: InboxMessageRow) {
    if (!appId || !selectedMailboxId || !replyBody.trim()) return;
    const to = replyTarget(message, selected?.address ?? null);
    if (!to) {
      showToast("No reply recipient.");
      return;
    }
    setReplySending(true);
    try {
      const subject = message.subject.startsWith("Re:")
        ? message.subject
        : `Re: ${message.subject}`;
      await sendMailMessage(appId, {
        mailboxId: selectedMailboxId,
        to: parseEmails(to),
        subject,
        bodyText: replyBody.trim(),
        replyToMessageId: message.id,
      });
      setReplyBody("");
      showToast("Reply sent");
      await loadCounts(appId, selectedMailboxId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Reply failed.");
    } finally {
      setReplySending(false);
    }
  }

  function selectByOffset(delta: number) {
    if (selectedIndex < 0) return;
    const next = visibleMessages[selectedIndex + delta];
    if (next) void onSelectMessage(next.id);
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white text-sm text-[var(--muted-foreground)] dark:bg-[var(--background)]">
        Loading inbox…
      </div>
    );
  }

  if (error && mailboxes.length === 0) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-white px-6 text-center dark:bg-[var(--background)]">
        <p className="text-sm text-[var(--danger)]">{error}</p>
        <Link
          href={appHref}
          className="inline-flex h-10 items-center rounded-full bg-[var(--foreground)] px-5 text-sm font-semibold text-[var(--background)]"
        >
          Go to mailboxes
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-white dark:bg-[var(--background)]">
      <header className="flex shrink-0 items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-3.5">
        <Link href={appHref} className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/rukny-logo.svg"
            alt=""
            width={30}
            height={30}
            className="shrink-0 dark:brightness-0 dark:invert"
            priority
          />
          <span className="hidden truncate text-sm font-semibold tracking-tight text-[var(--foreground)] sm:inline">
            Rukny Mail
          </span>
        </Link>

        <label className="mx-auto flex h-11 w-full max-w-xl items-center gap-2 rounded-full bg-[#f0f1f3] px-4 dark:bg-[var(--surface-secondary)]">
          <Search className="size-4 shrink-0 text-[var(--muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search in mail"
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
          />
        </label>

        <div className="flex shrink-0 items-center gap-1">
          <HeaderIcon label="Info">
            <Info className="size-4" />
          </HeaderIcon>
          <Link
            href={settingsHref}
            aria-label="Settings"
            className="inline-flex size-9 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
          >
            <Settings className="size-4" />
          </Link>
          <HeaderIcon label="Notifications">
            <Bell className="size-4" />
          </HeaderIcon>
          <span className="ml-1 flex size-9 items-center justify-center rounded-full bg-[var(--brand-blue-soft)] text-xs font-semibold text-[var(--secondary-foreground)]">
            RM
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-3 overflow-hidden px-3 pb-3 sm:gap-4 sm:px-4 sm:pb-4">
        <div className="hidden h-full shrink-0 sm:flex">
          <MailInboxSidebar
            mailboxes={mailboxes}
            selectedMailboxId={selectedMailboxId}
            onSelectMailbox={selectMailbox}
            folder={folder}
            onFolderChange={(id) => {
              setFolder(id);
              setSelectedMessageId(null);
              setMobileShowReader(false);
              setReplyBody("");
            }}
            counts={counts}
            onCompose={onCompose}
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden">
          <div className="flex shrink-0 items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={onCompose}
              className="inline-flex h-10 shrink-0 items-center rounded-full bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)]"
            >
              Compose
            </button>
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-0.5">
              {(
                [
                  "inbox",
                  "starred",
                  "sent",
                  "drafts",
                  "spam",
                  "archive",
                  "trash",
                ] as InboxFolderId[]
              ).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setFolder(id);
                    setSelectedMessageId(null);
                    setMobileShowReader(false);
                  }}
                  className={
                    folder === id
                      ? "shrink-0 rounded-full bg-[var(--brand-blue-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--secondary-foreground)]"
                      : "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)]"
                  }
                >
                  {id === "starred" ? "Favorites" : id.charAt(0).toUpperCase() + id.slice(1)}
                  {(counts[id] ?? 0) > 0 ? ` ${counts[id]}` : ""}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 gap-2 overflow-hidden rounded-[1.75rem] bg-[#f0f1f3] p-2 sm:rounded-[2rem] sm:p-2.5 dark:bg-[var(--surface-secondary)]">
          <div
            className={
              mobileShowReader && selectedMessage
                ? "hidden h-full min-w-0 shrink-0 sm:flex"
                : "flex h-full min-w-0 flex-1 lg:flex-none"
            }
          >
            <MailInboxListCard
              folder={folder}
              mailboxAddress={selected?.address ?? null}
              messages={visibleMessages}
              selectedId={selectedMessageId}
              onSelect={onSelectMessage}
              search={search}
              loading={messagesLoading}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onImportInbound={handleImportInbound}
              importing={importing}
              error={error}
            />
          </div>

          <div
            className={
              mobileShowReader && selectedMessage
                ? "flex h-full min-w-0 flex-1"
                : "hidden h-full min-w-0 flex-1 lg:flex"
            }
          >
            <MailInboxReaderCard
              message={selectedMessage}
              mailboxAddress={selected?.address ?? null}
              index={selectedIndex}
              total={visibleMessages.length}
              replyBody={replyBody}
              onReplyBodyChange={setReplyBody}
              replySending={replySending}
              onSendReply={() =>
                selectedMessage ? void onSendReply(selectedMessage) : undefined
              }
              onBack={() => {
                setMobileShowReader(false);
                setSelectedMessageId(null);
                setReplyBody("");
              }}
              onCompose={onCompose}
              onReply={() =>
                selectedMessage ? onReply(selectedMessage) : undefined
              }
              onForward={() =>
                selectedMessage ? onForward(selectedMessage) : undefined
              }
              onToggleStar={() =>
                selectedMessage ? void onToggleStar(selectedMessage) : undefined
              }
              onTrash={() =>
                selectedMessage ? void onTrash(selectedMessage) : undefined
              }
              onPrev={
                selectedIndex > 0 ? () => selectByOffset(-1) : undefined
              }
              onNext={
                selectedIndex >= 0 &&
                selectedIndex < visibleMessages.length - 1
                  ? () => selectByOffset(1)
                  : undefined
              }
            />
          </div>
          </div>
        </div>
      </div>

      <MailComposeModal
        open={composeOpen}
        fromAddress={selected?.address ?? null}
        initial={composeInitial}
        sending={sending}
        error={sendError}
        onClose={() => setComposeOpen(false)}
        onSend={handleSend}
      />

      {toast ? (
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[var(--foreground)] px-4 py-2.5 text-xs font-medium text-[var(--background)]">
          {toast}
        </div>
      ) : null}

      {mailboxes.length === 0 ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--background)]/95 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <p className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
              Create a mailbox first
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
              Your inbox needs at least one address on your domain.
            </p>
            <Link
              href={appHref}
              className="mt-6 inline-flex h-10 items-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)]"
            >
              Create mailbox
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HeaderIcon({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
    >
      {children}
    </button>
  );
}
