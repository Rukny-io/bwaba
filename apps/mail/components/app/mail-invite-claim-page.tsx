"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button, Skeleton } from "@heroui/react";
import { MailNotice } from "@/components/app/mail-notice";
import { resolveAccountsUrl } from "@rukny/auth/client/env-urls";
import {
  claimMailEmailInvite,
  previewMailEmailInvite,
  type MailEmailInvitePreview,
} from "@/lib/mail-team-client";
import { fetchCurrentUser } from "@/lib/api/auth";

export function MailInviteClaimPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = typeof params?.token === "string" ? params.token : "";

  const [preview, setPreview] = useState<MailEmailInvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Invalid invitation link.");
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const [invite, user] = await Promise.all([
          previewMailEmailInvite(token),
          fetchCurrentUser(),
        ]);
        if (cancelled) return;
        setPreview(invite);
        setSignedIn(Boolean(user));
        setUserEmail(user?.email ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Invitation not found.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onClaim() {
    if (!token || claiming) return;
    setClaiming(true);
    setError("");
    try {
      const result = await claimMailEmailInvite(token);
      window.location.assign(`/apps/${result.appId}/open`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join workspace.");
      setClaiming(false);
    }
  }

  function onSignIn() {
    const next = `/invite/${token}`;
    const accountsLogin = new URL("/login", resolveAccountsUrl());
    accountsLogin.searchParams.set(
      "next",
      typeof window !== "undefined"
        ? `${window.location.origin}${next}`
        : next,
    );
    window.location.assign(accountsLogin.toString());
  }

  const emailMismatch =
    Boolean(preview && userEmail) &&
    preview!.email.trim().toLowerCase() !== userEmail!.trim().toLowerCase();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-md space-y-5 rounded-2xl bg-[var(--surface)] p-6 md:p-8">
        <div>
          <p className="text-[13px] font-medium text-[var(--muted-foreground)]">
            Rukny Mail
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Workspace invite
          </h1>
        </div>

        {error ? (
          <MailNotice
            status="danger"
            title="Could not open invite"
            description={error}
          />
        ) : null}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ) : preview ? (
          <>
            <div className="space-y-1.5 text-sm leading-6 text-[var(--muted-foreground)]">
              <p>
                <span className="font-semibold text-[var(--foreground)]">
                  {preview.inviter.name || preview.inviter.email}
                </span>{" "}
                invited{" "}
                <span className="font-medium text-[var(--foreground)]" dir="ltr">
                  {preview.email}
                </span>{" "}
                to join{" "}
                <span className="font-semibold text-[var(--foreground)]">
                  {preview.workspace.name}
                </span>{" "}
                as{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {preview.role.toLowerCase()}
                </span>
                .
              </p>
              {preview.workspace.primaryDomain ? (
                <p dir="ltr">{preview.workspace.primaryDomain}</p>
              ) : null}
            </div>

            {emailMismatch ? (
              <MailNotice
                status="warning"
                title="Wrong account"
                description={`This invite is for ${preview.email}. Sign out and sign in with that email.`}
              />
            ) : null}

            {signedIn && !emailMismatch ? (
              <Button
                className="h-11 w-full rounded-full"
                isDisabled={claiming}
                onPress={() => void onClaim()}
              >
                {claiming ? "Joining…" : "Join workspace"}
              </Button>
            ) : (
              <Button
                className="h-11 w-full rounded-full"
                onPress={onSignIn}
              >
                Sign in to continue
              </Button>
            )}

            <p className="text-center text-[13px] text-[var(--muted-foreground)]">
              <Link
                href="/apps"
                className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/apps");
                }}
              >
                Back to workspaces
              </Link>
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
