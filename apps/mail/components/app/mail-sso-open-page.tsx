"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Skeleton } from "@heroui/react";
import { resolveAccountsUrl } from "@rukny/auth/client/env-urls";
import { MailNotice } from "@/components/app/mail-notice";
import { fetchCurrentUser, logout } from "@/lib/api/auth";
import {
  consumeMailSsoLink,
  previewMailSsoLink,
  type MailSsoLinkPreview,
} from "@/lib/mail-sso-client";

type Phase = "loading" | "signin" | "confirm" | "mismatch" | "opening" | "error";

export function MailSsoOpenPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = typeof params?.token === "string" ? params.token : "";
  const [phase, setPhase] = useState<Phase>("loading");
  const [preview, setPreview] = useState<MailSsoLinkPreview | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState("");
  const started = useRef(false);

  const consume = useCallback(
    async (confirm: boolean) => {
      setPhase("opening");
      setError("");
      try {
        const result = await consumeMailSsoLink(token, { confirm });
        if (result.needsConfirmation) {
          setPhase("confirm");
          return;
        }
        const next = result.mailboxOpened ? "?next=inbox" : "";
        router.replace(`/apps/${result.workspace.appId}/open${next}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not open your mailbox.");
        setPhase("error");
      }
    },
    [router, token],
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setError("Invalid sign-in link.");
      setPhase("error");
      return;
    }
    void (async () => {
      try {
        const [link, user] = await Promise.all([
          previewMailSsoLink(token),
          fetchCurrentUser(),
        ]);
        setPreview(link);
        setUserEmail(user?.email ?? null);
        if (!user) {
          setPhase("signin");
          return;
        }
        if (user.email.trim().toLowerCase() !== link.email) {
          setPhase("mismatch");
          return;
        }
        if (link.autoAccept) {
          await consume(false);
        } else {
          setPhase("confirm");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "This sign-in link is not valid.");
        setPhase("error");
      }
    })();
  }, [consume, token]);

  async function goToSignIn(switchAccount: boolean) {
    if (switchAccount) await logout().catch(() => undefined);
    const accountsLogin = new URL("/login", resolveAccountsUrl());
    accountsLogin.searchParams.set(
      "next",
      `${window.location.origin}/sso/open/${token}`,
    );
    if (preview?.email) accountsLogin.searchParams.set("email", preview.email);
    window.location.assign(accountsLogin.toString());
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-md space-y-5 rounded-2xl bg-[var(--surface)] p-6 md:p-8">
        <div>
          <p className="text-[13px] font-medium text-[var(--muted-foreground)]">Rukny Mail</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {phase === "opening" ? "Opening your mailbox…" : "Quick sign-in"}
          </h1>
        </div>

        {error ? (
          <MailNotice status="danger" title="Could not open link" description={error} />
        ) : null}

        {phase === "loading" || phase === "opening" ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ) : null}

        {preview && phase !== "loading" && phase !== "opening" && phase !== "error" ? (
          <div className="space-y-1.5 text-sm leading-6 text-[var(--muted-foreground)]">
            <p>
              Join{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {preview.workspace.name}
              </span>{" "}
              as{" "}
              <span className="font-medium text-[var(--foreground)]" dir="ltr">
                {preview.email}
              </span>
              .
            </p>
            {preview.mailbox ? (
              <p>
                Your mailbox:{" "}
                <span className="font-medium text-[var(--foreground)]" dir="ltr">
                  {preview.mailbox.address}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}

        {phase === "signin" ? (
          <Button className="h-11 w-full rounded-full" onPress={() => void goToSignIn(false)}>
            Continue with {preview?.email}
          </Button>
        ) : null}

        {phase === "confirm" ? (
          <Button className="h-11 w-full rounded-full" onPress={() => void consume(true)}>
            Join and open mailbox
          </Button>
        ) : null}

        {phase === "mismatch" && preview ? (
          <>
            <MailNotice
              status="warning"
              title="Wrong account"
              description={`You are signed in as ${userEmail}. This link is for ${preview.email}.`}
            />
            <Button className="h-11 w-full rounded-full" onPress={() => void goToSignIn(true)}>
              Sign in as {preview.email}
            </Button>
          </>
        ) : null}

        {phase === "error" ? (
          <Button
            variant="ghost"
            className="h-11 w-full rounded-full"
            onPress={() => router.replace("/apps")}
          >
            Go to Rukny Mail
          </Button>
        ) : null}
      </div>
    </div>
  );
}
