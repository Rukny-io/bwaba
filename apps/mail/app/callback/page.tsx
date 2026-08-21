"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resolveAccountsUrl } from "@rukny/auth/client/env-urls";
import { AuthShell } from "@/components/auth/auth-shell";
import { exchangeCodeOnce, fetchCurrentUser } from "@/lib/api/auth";
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
        <section className="w-full px-5 py-6 text-center">
          <h1 className="mb-4 text-xl font-bold">Sign-in failed</h1>
          <p className="mb-4 text-sm text-[var(--danger)]">{error}</p>
          <button
            type="button"
            className="text-sm font-medium underline"
            onClick={() => {
              clearStashedOAuthParams();
              router.replace("/login");
            }}
          >
            Back to sign in
          </button>
        </section>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <section className="w-full px-5 py-6 text-center">
        <h1 className="mb-4 text-xl font-bold">Signing you in</h1>
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="size-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          <p className="text-sm text-[var(--muted-foreground)]">Verifying your Rukny account…</p>
        </div>
      </section>
    </AuthShell>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <section className="w-full px-5 py-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
          </section>
        </AuthShell>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
