"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  KeyRound,
  Mail,
  Shield,
} from "lucide-react";
import { Button } from "@heroui/react";
import { resolveDeveloperUrl } from "@rukny/auth/client/env-urls";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";

const CONSOLE_TOPICS = [
  {
    icon: Mail,
    title: "Workspace session API",
    body: "Mail console calls authenticated /api/v1/mail/… routes with your Rukny session to manage mailboxes, team, routing, and domain setup for this workspace only.",
  },
  {
    icon: Shield,
    title: "Access & roles",
    body: "Owner and Admin manage domain and team. Billing can request plans. Members work day-to-day mail. Assigned users can open webmail for their mailbox.",
  },
  {
    icon: BookOpen,
    title: "Product guides",
    body: "End-user setup and troubleshooting stay in Documents — DNS, mailboxes, aliases, and deliverability — separate from API reference.",
  },
] as const;

const EMAIL_API_LINKS = [
  {
    href: "/documentation/email-api/get-started",
    title: "Get started",
    description: "Create an app, verify a domain, and send your first message.",
  },
  {
    href: "/documentation/email-api/authentication",
    title: "Authentication",
    description: "API keys and scopes for transactional send.",
  },
  {
    href: "/documentation/email-api/messages",
    title: "Messages",
    description: "POST /email/messages, idempotency, and status.",
  },
  {
    href: "/documentation/email-api/sdk",
    title: "SDKs",
    description: "Official clients and code samples.",
  },
] as const;

export function MailDevelopersPage() {
  const pathname = usePathname();
  const router = useRouter();
  const slot = parseMailSlot(pathname);
  const href = (path: string) => withMailSlot(path, slot);
  const developer = resolveDeveloperUrl();

  return (
    <section
      className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6"
      dir="ltr"
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Developers
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">
          Integrate around this Mail workspace, or send transactional email from
          your own apps with the public Email API on the Developers portal.
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-4 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)]">
            <Code2 className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Two products, clear split
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              <span className="font-medium text-[var(--foreground)]">Mail</span>{" "}
              is hosted mailboxes and the console you are in now.{" "}
              <span className="font-medium text-[var(--foreground)]">
                Email API
              </span>{" "}
              is a separate Developers product for sending from code with API
              keys — not shared seats or storage with this workspace.
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <h2 className="px-1 text-sm font-semibold text-[var(--foreground)]">
          This Mail workspace
        </h2>
        <ul className="flex flex-col gap-3">
          {CONSOLE_TOPICS.map((topic) => {
            const Icon = topic.icon;
            return (
              <li
                key={topic.title}
                className="flex min-w-0 gap-3 rounded-2xl bg-[var(--surface)] p-4 md:px-5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)]">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {topic.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {topic.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap gap-2 px-1">
          <Button
            size="sm"
            variant="secondary"
            onPress={() => router.push(href("/documents"))}
          >
            Open Documents
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => router.push(href("/settings"))}
          >
            Workspace settings
          </Button>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-[var(--muted-foreground)]" aria-hidden />
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Transactional Email API
              </h2>
            </div>
            <p className="mt-1 max-w-xl text-sm text-[var(--muted-foreground)]">
              Send from your backend with{" "}
              <code className="rounded-md bg-[var(--surface-secondary)] px-1.5 py-0.5 text-[12px]">
                X-API-Key
              </code>
              . Docs, SDKs, and API keys live on the Developers portal.
            </p>
          </div>
          <Button
            size="sm"
            onPress={() =>
              window.open(
                `${developer}/documentation/email-api`,
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            Open Email API docs
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Button>
        </div>

        <ul className="grid gap-2 sm:grid-cols-2">
          {EMAIL_API_LINKS.map((item) => (
            <li key={item.href}>
              <a
                href={`${developer}${item.href}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-start justify-between gap-2 rounded-xl bg-[var(--surface-secondary)] px-3.5 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_6%,var(--surface-secondary))]"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[var(--foreground)]">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-[var(--muted-foreground)]">
                    {item.description}
                  </span>
                </span>
                <ArrowUpRight
                  className="mt-0.5 size-3.5 shrink-0 text-[var(--muted-foreground)]"
                  aria-hidden
                />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onPress={() =>
              window.open(developer, "_blank", "noopener,noreferrer")
            }
          >
            Developers home
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() =>
              window.open(
                `${developer}/pricing`,
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            Email API pricing
          </Button>
        </div>
      </div>
    </section>
  );
}
