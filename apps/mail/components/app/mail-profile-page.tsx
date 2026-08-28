"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { resolveAccountsUrl } from "@rukny/auth/client/env-urls";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  Alert,
  Button,
  Link,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import { fetchCurrentUser, type AuthUser } from "@/lib/api/auth";
import { useMailTheme } from "@/components/theme-sync";
import { MailPersonAvatar } from "@/components/inbox/mail-person-avatar";
import { logoutAndRedirect } from "@/lib/logout";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";

const THEME_OPTIONS = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

export function MailProfilePage() {
  const pathname = usePathname();
  const slot = parseMailSlot(pathname);
  const href = (path: string) => withMailSlot(path, slot);
  const accountsBase = resolveAccountsUrl().replace(/\/$/, "");

  const { theme, setTheme } = useMailTheme();
  const [themeReady, setThemeReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setThemeReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const session = await fetchCurrentUser();
        if (!cancelled) setUser(session);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTheme = themeReady ? theme || "light" : "light";

  return (
    <section className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Profile
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Your Rukny account, appearance, and sign-in for this browser.
        </p>
      </div>

      {error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Profile</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-2 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="h-4 w-40 rounded-lg" />
          <Skeleton className="h-4 w-56 rounded-lg" />
        </div>
      ) : (
        <>
          <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Account</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Name, email, and security are managed in Rukny Accounts.
              </p>
            </div>

            <div className="flex min-w-0 items-center gap-3">
              <MailPersonAvatar
                name={user?.name || user?.username || user?.email || "Account"}
                email={user?.email}
                avatarUrl={user?.avatar}
                className="size-11"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">
                  {user?.name || user?.username || "Signed in"}
                </p>
                <p className="truncate text-sm text-[var(--muted-foreground)]" dir="ltr">
                  {user?.email || "—"}
                </p>
                {user?.username ? (
                  <p className="truncate text-xs text-[var(--muted-foreground)]" dir="ltr">
                    @{user.username}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`${accountsBase}/manage/personal-info`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium"
              >
                Personal info
                <Link.Icon />
              </Link>
              <Link
                href={`${accountsBase}/manage/security`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium"
              >
                Password and security
                <Link.Icon />
              </Link>
              <Link
                href={`${accountsBase}/manage`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium"
              >
                Open account dashboard
                <Link.Icon />
              </Link>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Appearance</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Theme for this browser only.
              </p>
            </div>
            <ToggleButtonGroup
              disallowEmptySelection
              selectionMode="single"
              size="sm"
              selectedKeys={new Set([selectedTheme])}
              onSelectionChange={(keys) => {
                const next = [...keys][0];
                if (next == null) return;
                setTheme(String(next));
              }}
            >
              {THEME_OPTIONS.map((option, index) => {
                const Icon = option.icon;
                return (
                  <ToggleButton key={option.id} id={option.id} isDisabled={!themeReady}>
                    {index > 0 ? <ToggleButtonGroup.Separator /> : null}
                    <Icon className="size-4" strokeWidth={1.8} />
                    {option.label}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          </div>

          <div className="flex min-w-0 flex-col gap-4 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Workspace</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Mail app name, plan, and domain settings live in Settings.
              </p>
            </div>
            <Button size="sm" variant="ghost" onPress={() => window.location.assign(href("/settings"))}>
              Open Settings
            </Button>
          </div>

          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onPress={() => void logoutAndRedirect()}>
              Sign out
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
