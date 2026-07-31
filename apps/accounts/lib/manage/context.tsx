"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { checkAuth } from "@/lib/api";
import {
  fetchAccountSummary,
  fetchProfile,
  fetchWorkspaceIncomingInvitations,
} from "@/lib/manage/api";
import type { AccountSummary, ManageUser, UserProfile } from "@/lib/manage/types";
import { ManageBootstrapSkeleton } from "@/components/manage/manage-bootstrap-skeleton";
import { Button } from "@/components/ui/button";

interface ManageContextValue {
  user: ManageUser;
  profile: UserProfile | null;
  summary: AccountSummary | null;
  isBootstrapping: boolean;
  bootstrapError: string | null;
  incomingInvitationsCount: number;
  refreshProfile: () => Promise<void>;
  refreshSummary: () => Promise<void>;
  refreshIncomingInvitations: () => Promise<void>;
  retryBootstrap: () => void;
  signOut: () => Promise<void>;
}

const ManageContext = createContext<ManageContextValue | null>(null);

export function ManageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const t = useTranslations("Manage");
  const [user, setUser] = useState<ManageUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [incomingInvitationsCount, setIncomingInvitationsCount] = useState(0);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await fetchProfile();
      setProfile(data);
      setBootstrapError(null);
    } catch {
      setBootstrapError(t("hub.load_error"));
    }
  }, [t]);

  const refreshSummary = useCallback(async () => {
    try {
      const data = await fetchAccountSummary();
      setSummary(data);
      setBootstrapError(null);
    } catch {
      setBootstrapError(t("hub.load_error"));
    }
  }, [t]);

  const refreshIncomingInvitations = useCallback(async () => {
    try {
      const data = await fetchWorkspaceIncomingInvitations();
      setIncomingInvitationsCount(Array.isArray(data) ? data.length : 0);
    } catch {
      /* الشارة اختيارية — لا نُظهر خطأ. */
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
    router.push("/login");
  }, [router]);

  const retryBootstrap = useCallback(() => {
    setBootstrapError(null);
    setIsBootstrapping(true);
    setBootstrapAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const session = await checkAuth();
        if (!mounted) return;

        if (!session.authenticated || !session.user) {
          if (session.rateLimited) {
            setBootstrapError(t("hub.rate_limit_error"));
            return;
          }
          router.replace("/login?next=/manage");
          return;
        }

        setUser(session.user);

        const [profileResult, summaryResult, invitationsResult] =
          await Promise.allSettled([
            fetchProfile(),
            fetchAccountSummary(),
            fetchWorkspaceIncomingInvitations(),
          ]);

        if (!mounted) return;

        let hadError = false;

        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value);
        } else {
          hadError = true;
        }

        if (summaryResult.status === "fulfilled") {
          setSummary(summaryResult.value);
        } else {
          hadError = true;
        }

        if (invitationsResult.status === "fulfilled") {
          setIncomingInvitationsCount(
            Array.isArray(invitationsResult.value)
              ? invitationsResult.value.length
              : 0,
          );
        }

        if (hadError) {
          setBootstrapError(t("hub.load_error"));
        }
      } catch {
        if (mounted) {
          router.replace("/login?next=/manage");
        }
      } finally {
        if (mounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [router, t, bootstrapAttempt]);

  const value = useMemo<ManageContextValue | null>(() => {
    if (!user) return null;
    return {
      user,
      profile,
      summary,
      isBootstrapping,
      bootstrapError,
      incomingInvitationsCount,
      refreshProfile,
      refreshSummary,
      refreshIncomingInvitations,
      retryBootstrap,
      signOut,
    };
  }, [
    user,
    profile,
    summary,
    isBootstrapping,
    bootstrapError,
    incomingInvitationsCount,
    refreshProfile,
    refreshSummary,
    refreshIncomingInvitations,
    retryBootstrap,
    signOut,
  ]);

  if (isBootstrapping) {
    return <ManageBootstrapSkeleton />;
  }

  if (!value) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-sm text-muted-foreground">
          {bootstrapError ?? t("hub.load_error")}
        </p>
        <Button type="button" variant="outline" onClick={retryBootstrap}>
          {t("hub.load_error_retry")}
        </Button>
      </div>
    );
  }

  return (
    <ManageContext.Provider value={value}>
      {bootstrapError && (
        <div className="border-b border-amber-500/25 bg-amber-50/90 px-4 py-2.5 dark:bg-amber-950/30">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-sm text-amber-900 dark:text-amber-100">
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{bootstrapError}</span>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={retryBootstrap}>
              {t("hub.load_error_retry")}
            </Button>
          </div>
        </div>
      )}
      {children}
    </ManageContext.Provider>
  );
}

export function useManage(): ManageContextValue {
  const ctx = useContext(ManageContext);
  if (!ctx) {
    throw new Error("useManage must be used within ManageProvider");
  }
  return ctx;
}
