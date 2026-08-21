"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Info,
  Search,
  Settings,
} from "lucide-react";
import { MailInboxSidebar, type InboxFolderId } from "@/components/inbox/mail-inbox-sidebar";
import {
  MailInboxListCard,
  type InboxListFilter,
  type InboxMessageRow,
} from "@/components/inbox/mail-inbox-list-card";
import { MailInboxReaderCard } from "@/components/inbox/mail-inbox-reader-card";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import {
  listMailMailboxes,
  type MailMailboxView,
} from "@/lib/mail-mailboxes-client";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";

const MAILBOX_STORAGE_KEY = "rukny_mail_selected_mailbox";

/** Demo rows until SES inbound is wired. */
function buildDemoMessages(mailbox: string): InboxMessageRow[] {
  return [
    {
      id: "demo-1",
      from: "Amazon SES",
      fromEmail: "no-reply@amazonses.com",
      to: mailbox,
      subject: "DKIM setup SUCCESS for your domain",
      preview: "DKIM verification completed in Europe (Stockholm) region.",
      body: `Hi,\n\nYour domain identity is verified for sending with Amazon SES.\n\nDKIM status: SUCCESS\nRegion: eu-north-1\n\nYou can now send from addresses on this domain. Inbound delivery to ${mailbox} will appear here once receiving is enabled.\n\n— Amazon SES`,
      receivedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
      unread: true,
      starred: true,
      category: "primary",
      tag: "Security",
      tagTone: "rose",
    },
    {
      id: "demo-2",
      from: "Rukny Mail",
      fromEmail: "hello@rukny.io",
      to: mailbox,
      subject: "Welcome to your business inbox",
      preview: "Your mailbox is ready. Compose and live receive are next.",
      body: `Welcome,\n\nThis is a preview of your Rukny Mail inbox layout.\n\n• Left: folders & mailbox switcher\n• Middle: message list card\n• Right: reading pane\n\nReal messages will replace these samples after SES send/receive is connected.\n\n— Rukny`,
      receivedAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
      unread: true,
      starred: false,
      category: "primary",
      tag: "Getting started",
      tagTone: "blue",
    },
    {
      id: "demo-3",
      from: "DNS Monitor",
      fromEmail: "alerts@rukny.io",
      to: mailbox,
      subject: "MX records look healthy",
      preview: "Inbound MX for your domain resolved correctly.",
      body: `Hello,\n\nWe checked your domain DNS and MX points to inbound-smtp.eu-north-1.amazonaws.com.\n\nNo action needed right now.\n\n— Rukny Mail`,
      receivedAt: new Date(Date.now() - 28 * 3600_000).toISOString(),
      unread: false,
      starred: false,
      category: "primary",
      tag: "DNS",
      tagTone: "emerald",
    },
    {
      id: "demo-4",
      from: "Product Updates",
      fromEmail: "news@rukny.io",
      to: mailbox,
      subject: "New mail features this month",
      preview: "Aliases, workflows, and smarter inbox filters.",
      body: `Hi there,\n\nHere's what's new in Rukny Mail this month — stay tuned as we wire live SES delivery.\n\n— Product`,
      receivedAt: new Date(Date.now() - 50 * 3600_000).toISOString(),
      unread: false,
      starred: false,
      category: "promotions",
      tag: "Promo",
      tagTone: "amber",
    },
  ];
}

export function MailInboxShell() {
  const pathname = usePathname();
  const slot = parseMailSlot(pathname);
  const appHref = withMailSlot("/app", slot);
  const settingsHref = withMailSlot("/settings", slot);

  const [mailboxes, setMailboxes] = useState<MailMailboxView[]>([]);
  const [selectedMailboxId, setSelectedMailboxId] = useState<string | null>(null);
  const [folder, setFolder] = useState<InboxFolderId>("inbox");
  const [filter, setFilter] = useState<InboxListFilter>("primary");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [composeHint, setComposeHint] = useState(false);
  const [error, setError] = useState("");
  const [mobileShowReader, setMobileShowReader] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const appId = readMailAppIdFromDocument();
      if (!appId) {
        if (!cancelled) {
          setError("Open a Mail app first.");
          setLoading(false);
        }
        return;
      }
      try {
        const boxes = await listMailMailboxes(appId);
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
          setError(err instanceof Error ? err.message : "Could not load mailboxes.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectMailbox = useCallback((id: string) => {
    if (id === "manage" || id === "none") return;
    setSelectedMailboxId(id);
    setSelectedMessageId(null);
    setMobileShowReader(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MAILBOX_STORAGE_KEY, id);
    }
  }, []);

  const selected = mailboxes.find((m) => m.id === selectedMailboxId) ?? null;

  const messages = useMemo(() => {
    if (!selected?.address || folder !== "inbox") return [];
    return buildDemoMessages(selected.address);
  }, [folder, selected?.address]);

  const visibleMessages = useMemo(() => {
    let list = messages.filter((m) => (m.category ?? "primary") === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.from.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q) ||
          m.preview.toLowerCase().includes(q),
      );
    }
    return list;
  }, [filter, messages, search]);

  const selectedMessage =
    visibleMessages.find((m) => m.id === selectedMessageId) ?? null;
  const selectedIndex = selectedMessage
    ? visibleMessages.findIndex((m) => m.id === selectedMessage.id)
    : -1;

  const counts = useMemo(
    () =>
      ({
        inbox: messages.length,
        starred: messages.filter((m) => m.starred).length,
        scheduled: 0,
        sent: 0,
        drafts: 0,
        spam: 0,
        archive: 0,
        trash: 0,
      }) satisfies Record<InboxFolderId, number>,
    [messages],
  );

  function onCompose() {
    setComposeHint(true);
    window.setTimeout(() => setComposeHint(false), 3200);
  }

  function onSelectMessage(id: string) {
    setSelectedMessageId(id);
    setMobileShowReader(true);
  }

  function selectByOffset(delta: number) {
    if (selectedIndex < 0) return;
    const next = visibleMessages[selectedIndex + delta];
    if (next) {
      setSelectedMessageId(next.id);
      setMobileShowReader(true);
    }
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
        {/* Isolated sidebar — outside the gray stage */}
        <div className="hidden h-full shrink-0 sm:flex">
          <MailInboxSidebar
            mailboxes={mailboxes}
            selectedMailboxId={selectedMailboxId}
            onSelectMailbox={selectMailbox}
            folder={folder}
            onFolderChange={(id) => {
              setFolder(id);
              setSelectedMessageId(null);
              setFilter("primary");
              setMobileShowReader(false);
            }}
            counts={counts}
            onCompose={onCompose}
          />
        </div>

        {/* Gray stage: groups Index + Reader cards */}
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
              messages={messages}
              filter={filter}
              onFilterChange={setFilter}
              selectedId={selectedMessageId}
              onSelect={onSelectMessage}
              search={search}
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
              onBack={() => {
                setMobileShowReader(false);
                setSelectedMessageId(null);
              }}
              onCompose={onCompose}
              onPrev={
                selectedIndex > 0 ? () => selectByOffset(-1) : undefined
              }
              onNext={
                selectedIndex >= 0 && selectedIndex < visibleMessages.length - 1
                  ? () => selectByOffset(1)
                  : undefined
              }
            />
          </div>
        </div>
      </div>

      {composeHint ? (
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[var(--foreground)] px-4 py-2.5 text-xs font-medium text-[var(--background)]">
          Compose & SES send coming next
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
