"use client";

import { ManageNavActions } from "./manage-nav-actions";

interface ManageDashboardNavProps {
  locale: string;
  onToggleLocale: () => void;
  onLogout: () => void;
  loggingOut: boolean;
  logoutLabel: string;
  avatar?: string | null;
  initials: string;
}

export function ManageDashboardNav({
  locale,
  onToggleLocale,
  onLogout,
  loggingOut,
  logoutLabel,
  avatar,
  initials,
}: ManageDashboardNavProps) {
  return (
    <header className="sticky top-0 z-40 hidden bg-transparent lg:block">
      <div className="flex items-center justify-end px-6 py-3">
        <ManageNavActions
          locale={locale}
          onToggleLocale={onToggleLocale}
          onLogout={onLogout}
          loggingOut={loggingOut}
          logoutLabel={logoutLabel}
          avatar={avatar}
          initials={initials}
          variant="avatar-only"
        />
      </div>
    </header>
  );
}
