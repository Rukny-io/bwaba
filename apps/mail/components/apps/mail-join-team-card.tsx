"use client";

import { useState } from "react";
import { KeyRound, Users } from "lucide-react";
import { discoverMailSso, mailSsoStartUrl } from "@/lib/mail-sso-client";

/**
 * For people without an invite on this account: company SSO if their domain has it,
 * otherwise guidance to get a quick sign-in link. Never reveals other workspaces.
 */
export function MailJoinTeamCard({ accountEmail }: { accountEmail: string | null }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(accountEmail ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function submit() {
    if (!valid || pending) return;
    const value = email.trim().toLowerCase();
    setPending(true);
    setMessage(null);
    try {
      const result = await discoverMailSso(value);
      if (result.sso) {
        window.location.href = mailSsoStartUrl(value);
        return;
      }
      setMessage({
        tone: "info",
        text:
          accountEmail && value !== accountEmail.toLowerCase()
            ? `You're signed in as ${accountEmail}. Ask your admin to invite ${value}, or sign in with that account.`
            : "No invite found for this account yet. Ask your workspace admin to add you from the SSO page — you'll get a one-click sign-in link by email.",
      });
    } catch (err) {
      setMessage({ tone: "error", text: (err as Error).message });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="dashboard-card flex flex-col gap-4 p-6 text-left">
      <span className="flex size-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]">
        <Users className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="font-semibold text-[var(--foreground)]">Join my team</p>
        <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
          Your company already uses Rukny Mail? Sign in to your team — no setup.
        </p>
      </div>

      {open ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label htmlFor="join-team-email" className="text-xs font-medium text-[var(--foreground)]">
            Work email
          </label>
          <div className="flex gap-2">
            <input
              id="join-team-email"
              type="email"
              dir="ltr"
              autoFocus
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
            <button
              type="submit"
              disabled={!valid || pending}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50"
            >
              {pending ? "…" : "Continue"}
            </button>
          </div>
          {message ? (
            <p
              role={message.tone === "error" ? "alert" : "status"}
              className={`text-xs leading-relaxed ${message.tone === "error" ? "text-[var(--danger)]" : "text-[var(--muted-foreground)]"}`}
            >
              {message.text}
            </p>
          ) : null}
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--surface-secondary)] px-6 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_8%,var(--surface-secondary))]"
        >
          <KeyRound className="size-4" />
          Quick sign-in
        </button>
      )}
    </div>
  );
}
