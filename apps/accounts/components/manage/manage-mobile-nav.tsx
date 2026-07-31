"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { manageNavGlassClass } from "./manage-nav-glass";
import { ManageNavActions } from "./manage-nav-actions";

interface ManageMobileNavProps {
  pageTitle: string;
  showBack: boolean;
  backHref: string;
  backLabel: string;
  isRtl: boolean;
  locale: string;
  onToggleLocale: () => void;
  onLogout: () => void;
  loggingOut: boolean;
  logoutLabel: string;
  avatar?: string | null;
  initials: string;
}

export function ManageMobileNav({
  pageTitle,
  showBack,
  backHref,
  backLabel,
  isRtl,
  locale,
  onToggleLocale,
  onLogout,
  loggingOut,
  logoutLabel,
  avatar,
  initials,
}: ManageMobileNavProps) {
  return (
    <header className="sticky top-0 z-40 bg-transparent lg:hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <nav
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 px-3 py-2",
            manageNavGlassClass,
          )}
          aria-label="Breadcrumb"
        >
          {showBack ? (
            <Link
              href={backHref}
              className="flex shrink-0 items-center text-muted-foreground transition-colors hover:text-foreground"
              aria-label={backLabel}
            >
              <ChevronLeft className={cn("size-5", !isRtl && "rotate-180")} />
            </Link>
          ) : (
            <Image
              src="/rukny-logo.svg"
              alt=""
              width={20}
              height={20}
              className="shrink-0"
            />
          )}
          <span className="truncate text-sm font-semibold text-foreground">
            {pageTitle}
          </span>
        </nav>

        <ManageNavActions
          locale={locale}
          onToggleLocale={onToggleLocale}
          onLogout={onLogout}
          loggingOut={loggingOut}
          logoutLabel={logoutLabel}
          avatar={avatar}
          initials={initials}
          className="shrink-0"
        />
      </div>
    </header>
  );
}
