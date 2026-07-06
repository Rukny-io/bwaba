"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { manageNavGlassClass } from "./manage-nav-glass";
import { ManageAvatar } from "./manage-ui";

interface ManageNavActionsProps {
  locale: string;
  onToggleLocale: () => void;
  onLogout: () => void;
  loggingOut: boolean;
  logoutLabel: string;
  avatar?: string | null;
  initials: string;
  className?: string;
  variant?: "full" | "avatar-only";
}

function NavAvatar({
  avatar,
  initials,
}: {
  avatar?: string | null;
  initials: string;
}) {
  return <ManageAvatar avatar={avatar} initials={initials} size="nav" />;
}

export function ManageNavActions({
  locale,
  onToggleLocale,
  onLogout,
  loggingOut,
  logoutLabel,
  avatar,
  initials,
  className,
  variant = "full",
}: ManageNavActionsProps) {
  if (variant === "avatar-only") {
    return (
      <Link
        href="/manage/personal-info"
        className={cn(
          "shrink-0 transition-opacity hover:opacity-90",
          className,
        )}
        aria-label="Profile"
      >
        <NavAvatar avatar={avatar} initials={initials} />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-1.5 py-1 sm:gap-1.5 sm:px-2 sm:py-1.5",
        manageNavGlassClass,
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggleLocale}
        className="flex size-8 items-center justify-center rounded-full text-xs text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
      >
        {locale === "ar" ? "EN" : "ع"}
      </button>

      <div className="h-5 w-px bg-border/40" aria-hidden />

      <button
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        aria-label={logoutLabel}
      >
        <LogOut className="size-4" />
      </button>

      <div className="h-5 w-px bg-border/40" aria-hidden />

      <Link
        href="/manage/personal-info"
        className="shrink-0 transition-opacity hover:opacity-90"
      >
        <NavAvatar avatar={avatar} initials={initials} />
      </Link>
    </div>
  );
}
