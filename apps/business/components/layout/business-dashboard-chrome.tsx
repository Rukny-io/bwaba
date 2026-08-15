'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { APP_BASE } from '@/lib/business-routes';
import { cn } from '@/lib/utils';

function isInboxConversationRoute(pathname: string): boolean {
  return pathname === `${APP_BASE}/inbox` || pathname.startsWith(`${APP_BASE}/inbox/`);
}

interface BusinessDashboardChromeProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function BusinessDashboardChrome({
  sidebar,
  children,
}: BusinessDashboardChromeProps) {
  const pathname = usePathname();
  const hideSidebar = isInboxConversationRoute(pathname);

  return (
    <div className="flex min-h-0 flex-1">
      {!hideSidebar ? sidebar : null}
      <div
        className={cn(
          'relative flex min-w-0 flex-1 flex-col gap-0 p-0',
          !hideSidebar && 'sm:mr-[82px]',
        )}
      >
        {children}
      </div>
    </div>
  );
}

export { isInboxConversationRoute };
