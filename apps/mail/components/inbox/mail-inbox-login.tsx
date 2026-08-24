"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Input, InputOTP, Label, TextField } from "@heroui/react";
import type { MailMailboxView } from "@/lib/mail-mailboxes-client";
import { unlockMailMailbox } from "@/lib/mail-mailbox-session-client";

type Props = {
  appId: string;
  appHref: string;
  mailboxes: MailMailboxView[];
  preferredMailboxId?: string | null;
  onUnlocked: (mailbox: MailMailboxView) => void;
};

export function MailInboxLogin({
  appId,
  appHref,
  mailboxes,
  preferredMailboxId,
  onUnlocked,
}: Props) {
  const signInBoxes = useMemo(
    () =>
      mailboxes.filter(
        (box) => box.status === "ACTIVE" && box.hasPassword,
      ),
    [mailboxes],
  );

  const [address, setAddress] = useState(() => {
    const preferred = signInBoxes.find((box) => box.id === preferredMailboxId);
    if (preferred) return preferred.address;
    return signInBoxes.length === 1 ? signInBoxes[0].address : "";
  });
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!appId || busy) return;
    const nextAddress = address.trim().toLowerCase();
    if (!nextAddress || !password) {
      setError("Enter your mailbox address and password.");
      return;
    }
    if (needsTotp && totp.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await unlockMailMailbox(appId, {
        address: nextAddress,
        password,
        totp: needsTotp ? totp : undefined,
      });
      if (result.needsTotp) {
        setNeedsTotp(true);
        setAddress(result.address);
        setTotp("");
        return;
      }
      onUnlocked(result.mailbox);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not sign in to this mailbox.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-white dark:bg-[var(--background)]">
      <header className="flex shrink-0 items-center gap-2.5 px-5 py-3.5">
        <Link
          href={appHref}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <Image
            src="/rukny-logo.svg"
            alt=""
            width={28}
            height={28}
            className="shrink-0 dark:brightness-0 dark:invert"
            priority
          />
          <span className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
            Rukny Mail
          </span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="w-full max-w-[400px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8"
        >
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            {needsTotp ? "Two-factor authentication" : "Sign in to webmail"}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
            {needsTotp
              ? `Enter the 6-digit code for ${address}.`
              : "Use the mailbox address and password you created for this workspace."}
          </p>

          {signInBoxes.length === 0 ? (
            <p className="mt-5 text-sm text-[var(--danger)]" role="alert">
              This app has no mailbox with a password yet. Create one first.
            </p>
          ) : needsTotp ? (
            <div className="mt-6 flex justify-center" dir="ltr">
              <InputOTP
                maxLength={6}
                value={totp}
                onChange={setTotp}
                aria-label="Authenticator code"
              >
                <InputOTP.Group>
                  <InputOTP.Slot index={0} />
                  <InputOTP.Slot index={1} />
                  <InputOTP.Slot index={2} />
                </InputOTP.Group>
                <InputOTP.Separator />
                <InputOTP.Group>
                  <InputOTP.Slot index={3} />
                  <InputOTP.Slot index={4} />
                  <InputOTP.Slot index={5} />
                </InputOTP.Group>
              </InputOTP>
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="mailbox-address"
                  className="text-xs font-medium text-[var(--muted-foreground)]"
                >
                  Mailbox address
                </Label>
                {signInBoxes.length > 1 ? (
                  <select
                    id="mailbox-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                  >
                    <option value="">Select a mailbox</option>
                    {signInBoxes.map((box) => (
                      <option key={box.id} value={box.address}>
                        {box.address}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="mailbox-address"
                    type="email"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    autoComplete="username"
                    required
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                  />
                )}
              </div>
              <TextField isRequired className="gap-1.5">
                <Label className="text-xs font-medium text-[var(--muted-foreground)]">
                  Password
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </TextField>
            </div>
          )}

          {error ? (
            <p className="mt-4 text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}

          {signInBoxes.length > 0 ? (
            <button
              type="submit"
              disabled={
                busy ||
                (!needsTotp && (!address.trim() || !password)) ||
                (needsTotp && totp.length !== 6)
              }
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-[var(--foreground)] text-sm font-semibold text-[var(--background)] disabled:opacity-50"
            >
              {busy
                ? "Signing in…"
                : needsTotp
                  ? "Verify code"
                  : "Sign in"}
            </button>
          ) : null}

          {needsTotp ? (
            <button
              type="button"
              onClick={() => {
                setNeedsTotp(false);
                setTotp("");
                setError("");
              }}
              className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-medium text-[var(--muted-foreground)] hover:bg-[rgba(15,23,42,0.06)]"
            >
              Back
            </button>
          ) : (
            <Link
              href={appHref}
              className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-medium text-[var(--muted-foreground)] hover:bg-[rgba(15,23,42,0.06)]"
            >
              Manage mailboxes
            </Link>
          )}
        </form>
      </div>
    </div>
  );
}
