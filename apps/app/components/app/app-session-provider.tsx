'use client';

import { SessionKeepAlive } from '@rukny/auth/client/session-keepalive';
import { ThemeProvider } from '@/components/theme-provider';
import { refreshOnce } from '@/lib/api-client';

export function AppSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <SessionKeepAlive pathPrefix="/app" refresh={refreshOnce} />
      {children}
    </ThemeProvider>
  );
}
