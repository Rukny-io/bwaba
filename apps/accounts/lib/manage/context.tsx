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
import { checkAuth } from "@/lib/api";
import { fetchAccountSummary, fetchProfile } from "@/lib/manage/api";
import type { AccountSummary, ManageUser, UserProfile } from "@/lib/manage/types";

interface ManageContextValue {
  user: ManageUser;
  profile: UserProfile | null;
  summary: AccountSummary | null;
  isBootstrapping: boolean;
  refreshProfile: () => Promise<void>;
  refreshSummary: () => Promise<void>;
  signOut: () => Promise<void>;
}

const ManageContext = createContext<ManageContextValue | null>(null);

export function ManageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<ManageUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await fetchProfile();
      setProfile(data);
    } catch {
      /* profile fetch failed — keep stale data */
    }
  }, []);

  const refreshSummary = useCallback(async () => {
    try {
      const data = await fetchAccountSummary();
      setSummary(data);
    } catch {
      /* summary optional */
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

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const session = await checkAuth();
        if (!mounted) return;

        if (!session.authenticated || !session.user) {
          router.replace("/login?next=/manage");
          return;
        }

        setUser(session.user);

        const [profileResult, summaryResult] = await Promise.allSettled([
          fetchProfile(),
          fetchAccountSummary(),
        ]);

        if (!mounted) return;

        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value);
        }
        if (summaryResult.status === "fulfilled") {
          setSummary(summaryResult.value);
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
  }, [router]);

  const value = useMemo<ManageContextValue | null>(() => {
    if (!user) return null;
    return {
      user,
      profile,
      summary,
      isBootstrapping,
      refreshProfile,
      refreshSummary,
      signOut,
    };
  }, [user, profile, summary, isBootstrapping, refreshProfile, refreshSummary, signOut]);

  if (isBootstrapping || !value) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <ManageContext.Provider value={value}>{children}</ManageContext.Provider>
  );
}

export function useManage(): ManageContextValue {
  const ctx = useContext(ManageContext);
  if (!ctx) {
    throw new Error("useManage must be used within ManageProvider");
  }
  return ctx;
}
