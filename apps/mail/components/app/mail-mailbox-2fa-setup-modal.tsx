"use client";

import { InputOTP, Label } from "@heroui/react";

type Props = {
  address: string;
  qrCodeUrl: string;
  manualEntryKey: string;
  code: string;
  busy: boolean;
  error: string;
  onCodeChange: (code: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function MailMailbox2faSetupModal({
  address,
  qrCodeUrl,
  manualEntryKey,
  code,
  busy,
  error,
  onCodeChange,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm();
        }}
        className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-5"
      >
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          Set up two-factor authentication
        </h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{address}</p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
          Scan this QR code in Google Authenticator, Authy, or another TOTP app,
          then enter a 6-digit code to turn 2FA on.
        </p>
        <div className="mt-4 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCodeUrl}
            alt={`QR code for ${address}`}
            className="size-44 rounded-xl bg-white p-2"
          />
        </div>
        <p className="mt-3 text-center text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Manual key
        </p>
        <p
          dir="ltr"
          className="mt-1 break-all text-center font-mono text-xs text-[var(--foreground)]"
        >
          {manualEntryKey}
        </p>
        <Label className="mt-4 text-xs font-medium text-[var(--muted-foreground)]">
          Authenticator code
        </Label>
        <div className="mt-2 flex justify-center" dir="ltr">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={onCodeChange}
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
        {error ? (
          <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="inline-flex h-9 items-center rounded-lg bg-[var(--foreground)] px-4 text-[13px] font-semibold text-[var(--background)] disabled:opacity-50"
          >
            {busy ? "Confirming…" : "Turn on 2FA"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex h-9 items-center rounded-lg px-4 text-[13px] font-medium text-[var(--muted-foreground)] hover:bg-[rgba(15,23,42,0.06)]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
