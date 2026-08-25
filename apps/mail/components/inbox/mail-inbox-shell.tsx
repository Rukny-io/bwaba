"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenSquare, Search, Settings, X } from "lucide-react";
import { cn } from "@heroui/react";
import {
  MailInboxSidebar,
  type InboxFolderId,
} from "@/components/inbox/mail-inbox-sidebar";
import {
  MailInboxListCard,
  type InboxMessageRow,
} from "@/components/inbox/mail-inbox-list-card";
import { MailInboxReaderCard } from "@/components/inbox/mail-inbox-reader-card";
import { MailInboxLogin } from "@/components/inbox/mail-inbox-login";
import {
  MailComposeModal,
  type ComposeDraft,
} from "@/components/inbox/mail-compose-modal";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import {
  listMailMailboxes,
  type MailMailboxView,
} from "@/lib/mail-mailboxes-client";
import { MailInboxMailboxSwitcher } from "@/components/inbox/mail-inbox-mailbox-switcher";
import {
  getMailMailboxSession,
  lockMailMailbox,
  selectMailMailbox,
} from "@/lib/mail-mailbox-session-client";
import { readMailboxQueryId, writeMailboxQueryId } from "@/lib/mail-inbox-url";
import {
  getMailMessage,
  getMailMessageCounts,
  importInboundMailMessages,
  listMailMessages,
  MailboxLockedError,
  sendMailMessage,
  updateMailMessage,
  type MailFolderCounts,
  type MailMessageFolderApi,
  type MailMessageView,
} from "@/lib/mail-messages-client";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";

const FOLDER_TO_API: Partial<Record<InboxFolderId, MailMessageFolderApi>> = {
  inbox: "INBOX",
  sent: "SENT",
  drafts: "DRAFTS",
  spam: "SPAM",
  archive: "ARCHIVE",
  trash: "TRASH",
};

const INBOX_PAGE_SIZE = 15;

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
    fromAvatarUrl: msg.fromAvatarUrl ?? null,
    to: msg.to.join(", "),
    toList: msg.to,
    subject: msg.subject || "(no subject)",
    preview: msg.preview || body.slice(0, 140),
    body,
    bodyHtml: msg.bodyHtml,
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
  const [switchingMailbox, setSwitchingMailbox] = useState(false);
  const [loginPreferredId, setLoginPreferredId] = useState<string | null>(null);
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [listPage, setListPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
          err instanceof MailboxLockedError
            ? ""
            : err instanceof Error
              ? err.message
              : "Could not load messages.",
        );
        if (err instanceof MailboxLockedError) {
          setSelectedMailboxId(null);
        }
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
          setError("Open a workspace first.");
          setLoading(false);
        }
        return;
      }
      setAppId(id);
      try {
        const boxes = await listMailMailboxes(id);
        if (cancelled) return;
        setMailboxes(boxes);
        let unlocked: MailMailboxView | null = null;
        try {
          const session = await getMailMailboxSession(id);
          unlocked = session.mailbox;
        } catch {
          unlocked = null;
        }
        if (cancelled) return;
        const requestedId = readMailboxQueryId();
        const active = boxes.filter((box) => box.status === "ACTIVE");
        const wantId =
          requestedId && active.some((box) => box.id === requestedId)
            ? requestedId
            : null;
        if (wantId && wantId !== unlocked?.id) {
          try {
            const selectedBox = await selectMailMailbox(id, wantId);
            unlocked = selectedBox;
            setMailboxes((prev) =>
              prev.some((box) => box.id === selectedBox.id)
                ? prev.map((box) =>
                    box.id === selectedBox.id ? selectedBox : box,
                  )
                : [...prev, selectedBox],
            );
          } catch {
            setLoginPreferredId(wantId);
          }
        }
        if (cancelled) return;
        setSelectedMailboxId(unlocked?.id ?? null);
        if (unlocked) writeMailboxQueryId(unlocked.id);
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

  // Instant updates via SSE (no polling interval).
  useEffect(() => {
    if (!appId || !selectedMailboxId) return;
    const url = `/api/v1/mail/apps/${encodeURIComponent(appId)}/messages/stream`;
    const source = new EventSource(url, { withCredentials: true });

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data)) as {
          type?: string;
          mailboxId?: string;
          folder?: string;
        };
        if (!data?.type || data.type === 'ping' || data.type === 'connected') {
          return;
        }
        if (data.type !== 'mail.changed') return;
        if (
          selectedMailboxId &&
          data.mailboxId &&
          data.mailboxId !== selectedMailboxId
        ) {
          void loadCounts(appId, selectedMailboxId);
          return;
        }
        if (!selectedMailboxId) return;
        void loadMessages(appId, selectedMailboxId, folder, { quiet: true });
        void loadCounts(appId, selectedMailboxId);
      } catch {
        /* ignore malformed events */
      }
    };

    return () => {
      source.close();
    };
  }, [
    appId,
    selectedMailboxId,
    folder,
    loadMessages,
    loadCounts,
  ]);

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
        const stored = result.stored;
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

  const listPageCount = Math.max(
    1,
    Math.ceil(visibleMessages.length / INBOX_PAGE_SIZE),
  );
  const safeListPage = Math.min(Math.max(1, listPage), listPageCount);
  const pagedMessages = useMemo(() => {
    const start = (safeListPage - 1) * INBOX_PAGE_SIZE;
    return visibleMessages.slice(start, start + INBOX_PAGE_SIZE);
  }, [safeListPage, visibleMessages]);

  const selectedMessage =
    visibleMessages.find((m) => m.id === selectedMessageId) ?? null;
  const selectedIndex = selectedMessage
    ? visibleMessages.findIndex((m) => m.id === selectedMessage.id)
    : -1;

  useEffect(() => {
    setListPage(1);
  }, [folder, search, selectedMailboxId]);

  useEffect(() => {
    if (!selectedMessageId) return;
    const idx = visibleMessages.findIndex((m) => m.id === selectedMessageId);
    if (idx < 0) return;
    setListPage(Math.floor(idx / INBOX_PAGE_SIZE) + 1);
  }, [selectedMessageId, visibleMessages]);

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
      if (err instanceof MailboxLockedError) {
        setSelectedMailboxId(null);
      }
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
      const stored = result.stored;
      const unmatched = result.unmatched;
      const failed = result.errors + result.missing;
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
      if (err instanceof MailboxLockedError) {
        setSelectedMailboxId(null);
        return;
      }
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
      if (err instanceof MailboxLockedError) {
        setSelectedMailboxId(null);
        return;
      }
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
      if (err instanceof MailboxLockedError) {
        setSelectedMailboxId(null);
        return;
      }
      showToast(err instanceof Error ? err.message : "Reply failed.");
    } finally {
      setReplySending(false);
    }
  }

  async function handleLockMailbox() {
    if (!appId) {
      setSelectedMailboxId(null);
      return;
    }
    try {
      await lockMailMailbox(appId);
    } catch {
      /* still lock locally */
    }
    setSelectedMailboxId(null);
    setSelectedMessageId(null);
    setMobileShowReader(false);
    setMessages([]);
    setCounts(emptyCounts());
    setComposeOpen(false);
    setReplyBody("");
    writeMailboxQueryId(null);
  }

  async function handleSwitchMailbox(mailboxId: string) {
    if (!appId || mailboxId === selectedMailboxId || switchingMailbox) return;
    setSwitchingMailbox(true);
    try {
      const mailbox = await selectMailMailbox(appId, mailboxId);
      setMailboxes((prev) =>
        prev.some((box) => box.id === mailbox.id)
          ? prev.map((box) => (box.id === mailbox.id ? mailbox : box))
          : [...prev, mailbox],
      );
      setSelectedMailboxId(mailbox.id);
      setFolder("inbox");
      setSelectedMessageId(null);
      setMobileShowReader(false);
      setSearch("");
      setComposeOpen(false);
      setReplyBody("");
      setError("");
      writeMailboxQueryId(mailbox.id);
      showToast(`Viewing ${mailbox.address}`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not switch mailbox.",
      );
    } finally {
      setSwitchingMailbox(false);
    }
  }

  function selectByOffset(delta: number) {
    if (selectedIndex < 0) return;
    const next = visibleMessages[selectedIndex + delta];
    if (next) void onSelectMessage(next.id);
  }

  useEffect(() => {
    if (!searchOpen) return;
    const id = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [searchOpen]);

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

  if (mailboxes.length > 0 && !selectedMailboxId && appId) {
    return (
      <MailInboxLogin
        appId={appId}
        appHref={appHref}
        mailboxes={mailboxes}
        preferredMailboxId={loginPreferredId}
        onUnlocked={(mailbox) => {
          setMailboxes((prev) =>
            prev.some((box) => box.id === mailbox.id)
              ? prev.map((box) => (box.id === mailbox.id ? mailbox : box))
              : [...prev, mailbox],
          );
          setSelectedMailboxId(mailbox.id);
          setError("");
          writeMailboxQueryId(mailbox.id);
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden dark:bg-[var(--background)]",
        mobileShowReader && selectedMessage
          ? "max-md:bg-[#eef0f3] bg-white"
          : "bg-white",
      )}
    >
      <header
        className={cn(
          "relative z-20 flex shrink-0 items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3.5",
          mobileShowReader && selectedMessage ? "max-md:hidden" : "",
        )}
      >
        <Link
          href={appHref}
          className="relative z-10 flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <Image
            src="/rukny-logo.svg"
            alt=""
            width={28}
            height={28}
            className="shrink-0 dark:brightness-0 dark:invert"
            priority
          />
          <span className="hidden truncate text-[15px] font-semibold tracking-tight text-[var(--foreground)] md:inline">
            Rukny Mail
          </span>
        </Link>

        {/* Desktop / large tablet search */}
        <label className="mx-auto hidden h-11 w-full max-w-xl items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-4 transition-[box-shadow] focus-within:shadow-[0_0_0_3px_var(--brand-blue-soft)] md:flex">
          <Search className="size-4 shrink-0 text-[var(--muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search in mail"
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
          />
        </label>

        {/* Mobile actions: search expands over this cluster */}
        <div className="relative ml-auto flex min-w-0 flex-1 items-center justify-end gap-1.5 md:ml-0 md:flex-none md:gap-1">
          <div
            className={cn(
              "absolute inset-y-0 left-0 right-0 z-20 flex items-center md:hidden",
              "origin-right transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              searchOpen
                ? "pointer-events-auto translate-x-0 scale-100 opacity-100"
                : "pointer-events-none translate-x-3 scale-95 opacity-0",
            )}
          >
            <label className="flex h-10 w-full items-center gap-2 rounded-full bg-[var(--surface-secondary)] pl-3.5 pr-1.5 shadow-sm">
              <Search className="size-4 shrink-0 text-[var(--muted-foreground)]" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search in mail"
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-white hover:text-[var(--foreground)] dark:hover:bg-[var(--surface)]"
              >
                <X className="size-4" />
              </button>
            </label>
          </div>

          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] md:hidden",
              searchOpen ? "pointer-events-none opacity-0" : "opacity-100",
            )}
          >
            <Search className="size-4" />
          </button>

          <button
            type="button"
            onClick={onCompose}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--primary)] px-3.5 text-sm font-semibold text-[var(--primary-foreground)] transition-[opacity,transform] active:scale-[0.98] lg:hidden",
              searchOpen ? "pointer-events-none opacity-0" : "opacity-100",
            )}
          >
            <PenSquare className="size-3.5" aria-hidden />
            Compose
          </button>

          <Link
            href={settingsHref}
            aria-label="Settings"
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] sm:size-9",
              searchOpen ? "max-md:pointer-events-none max-md:opacity-0" : "opacity-100",
            )}
          >
            <Settings className="size-4" />
          </Link>
          <span
            className={cn(
              "ml-0.5 flex",
              searchOpen ? "max-md:pointer-events-none max-md:opacity-0" : "opacity-100",
            )}
          >
            <MailInboxMailboxSwitcher
              mailboxes={mailboxes}
              selectedId={selectedMailboxId}
              disabled={switchingMailbox}
              onSelect={(id) => void handleSwitchMailbox(id)}
              onLock={() => void handleLockMailbox()}
            />
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-0 overflow-hidden px-0 pb-0 md:gap-3 md:px-3 md:pb-3 lg:gap-4 lg:px-4 lg:pb-4">
        <div className="hidden h-full shrink-0 lg:flex">
          <MailInboxSidebar
            folder={folder}
            onFolderChange={(id) => {
              setFolder(id);
              setSelectedMessageId(null);
              setMobileShowReader(false);
              setReplyBody("");
            }}
            counts={counts}
            onCompose={onCompose}
            mailboxSwitcher={
              <MailInboxMailboxSwitcher
                variant="sidebar"
                mailboxes={mailboxes}
                selectedId={selectedMailboxId}
                disabled={switchingMailbox}
                onSelect={(id) => void handleSwitchMailbox(id)}
                onLock={() => void handleLockMailbox()}
              />
            }
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div
            className={cn(
              "shrink-0 px-3 pb-2.5 pt-0 lg:hidden",
              mobileShowReader && selectedMessage ? "max-md:hidden" : "",
            )}
          >
            <div
              className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Mail folders"
            >
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
              ).map((id) => {
                const active = folder === id;
                const count = counts[id] ?? 0;
                const label =
                  id === "starred"
                    ? "Favorites"
                    : id.charAt(0).toUpperCase() + id.slice(1);
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setFolder(id);
                      setSelectedMessageId(null);
                      setMobileShowReader(false);
                    }}
                    className={cn(
                      "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors duration-150",
                      active
                        ? "bg-[var(--brand-blue-soft)] text-[var(--secondary-foreground)] shadow-[inset_0_0_0_1px_rgba(59,130,246,0.12)]"
                        : "bg-[var(--surface-secondary)]/70 text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]",
                    )}
                  >
                    {label}
                    {count > 0 ? (
                      <span
                        className={cn(
                          "min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums",
                          active
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "bg-white text-[var(--muted-foreground)] dark:bg-[var(--surface)]",
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

          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 gap-2 overflow-hidden dark:bg-[var(--surface-secondary)]",
              mobileShowReader && selectedMessage
                ? "max-md:mx-0 max-md:mb-0 max-md:rounded-none max-md:bg-transparent max-md:p-0 max-md:pt-[max(0.75rem,env(safe-area-inset-top))]"
                : "mx-3 mb-3 rounded-2xl bg-[#eef0f3] p-2",
              "md:mx-0 md:mb-0 md:rounded-2xl md:bg-[#eef0f3] md:p-2 lg:gap-2.5 lg:p-2.5",
            )}
          >
            <div
              className={cn(
                "h-full min-w-0",
                mobileShowReader && selectedMessage
                  ? "hidden md:flex md:w-[280px] md:shrink-0 lg:w-[340px] xl:w-[380px]"
                  : "flex w-full flex-1 md:min-w-[280px] lg:w-[340px] lg:flex-none xl:w-[380px]",
              )}
            >
              <MailInboxListCard
                folder={folder}
                mailboxAddress={selected?.address ?? null}
                mailboxAvatarUrl={selected?.avatarUrl ?? null}
                messages={pagedMessages}
                selectedId={selectedMessageId}
                onSelect={onSelectMessage}
                search={search}
                loading={messagesLoading}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                onImportInbound={handleImportInbound}
                importing={importing}
                error={error}
                page={safeListPage}
                pageCount={listPageCount}
                onPageChange={setListPage}
              />
            </div>

            <div
              className={cn(
                "h-full min-w-0 flex-1",
                mobileShowReader && selectedMessage
                  ? "flex"
                  : "hidden lg:flex",
              )}
            >
              <MailInboxReaderCard
                message={selectedMessage}
                mailboxAddress={selected?.address ?? null}
                mailboxAvatarUrl={selected?.avatarUrl ?? null}
                index={selectedIndex}
                total={visibleMessages.length}
                replyBody={replyBody}
                onReplyBodyChange={setReplyBody}
                replySending={replySending}
                onSendReply={() =>
                  selectedMessage
                    ? void onSendReply(selectedMessage)
                    : undefined
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
                  selectedMessage
                    ? void onToggleStar(selectedMessage)
                    : undefined
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
        fromAvatarUrl={selected?.avatarUrl ?? null}
        fromDisplayName={selected?.displayName ?? selected?.localPart ?? null}
        initial={composeInitial}
        sending={sending}
        error={sendError}
        onClose={() => setComposeOpen(false)}
        onSend={handleSend}
      />

      {toast ? (
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 animate-[inbox-toast_280ms_ease-out] rounded-full bg-[var(--foreground)] px-4 py-2.5 text-xs font-medium text-[var(--background)] shadow-lg">
          {toast}
        </div>
      ) : null}

      {mailboxes.length === 0 ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--background)]/95 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
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
