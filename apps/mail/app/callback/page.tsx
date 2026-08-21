"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resolveAccountsUrl } from "@rukny/auth/client/env-urls";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthErrorCard, AuthLoadingCard } from "@/components/auth/auth-status-card";
import { exchangeCodeOnce, fetchCurrentUser } from "@/lib/api/auth";
import { resetAuthClientState } from "@/lib/api-client";
import { DEFAULT_APP_PATH, resolveClientNext } from "@/lib/auth-redirect";
import {
  clearOAuthParamsFromUrl,
  clearStashedOAuthParams,
  readOAuthCallbackParams,
  readStashedOAuthParams,
  stashOAuthParams,
} from "@/lib/oauth-callback";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    resetAuthClientState();

    const fromUrl = readOAuthCallbackParams(searchParams);
    if (fromUrl.code) {
      stashOAuthParams({ code: fromUrl.code, next: fromUrl.next });
      clearOAuthParamsFromUrl();
    }

    const stashed = readStashedOAuthParams();
    const code = fromUrl.code || stashed.code;
    const nextRaw = fromUrl.next || stashed.next;

    if (!code) {
      hasRun.current = false;
      router.replace("/login");
      return;
    }

    const storedNext = localStorage.getItem("auth_next");
    const nextPath = resolveClientNext(
      searchParams.get("next") ?? nextRaw ?? storedNext,
      DEFAULT_APP_PATH,
    );

    (async () => {
      try {
        const result = await exchangeCodeOnce(code);
        clearStashedOAuthParams();

        if (!result.success) {
          setError(result.message || "Could not complete sign-in.");
          return;
        }

        localStorage.removeItem("auth_next");

        if (result.needsProfileCompletion) {
          const complete = new URL("/complete-profile", resolveAccountsUrl());
          complete.searchParams.set("next", `${window.location.origin}${nextPath}`);
          window.location.href = complete.toString();
          return;
        }

        if (result.requires2FA && result.pendingSessionId) {
          const verify = new URL("/verify-2fa", resolveAccountsUrl());
          verify.searchParams.set("sessionId", result.pendingSessionId);
          window.location.href = verify.toString();
          return;
        }

        const user = await fetchCurrentUser();
        if (user) {
          window.location.replace(nextPath);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 150));
        const retryUser = await fetchCurrentUser();
        if (retryUser) {
          window.location.replace(nextPath);
          return;
        }

        setError("Signed in, but the session was not saved. Try again.");
      } catch (err: unknown) {
        const existing = await fetchCurrentUser();
        if (existing) {
          clearStashedOAuthParams();
          window.location.replace(nextPath);
          return;
        }

        setError(err instanceof Error ? err.message : "Something went wrong while signing in.");
      }
    })();
  }, [router, searchParams]);

  if (error) {
    return (
      <AuthShell>
        <AuthErrorCard
          title="Sign-in failed"
          description={error}
          onAction={() => {
            clearStashedOAuthParams();
            router.replace("/login");
          }}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthLoadingCard
        title="Signing you in"
        description="Verifying your Rukny account…"
      />
    </AuthShell>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <AuthLoadingCard title="Loading" description="Just a moment…" />
        </AuthShell>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
