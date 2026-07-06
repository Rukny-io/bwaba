'use client';

import { SessionKeepAlive } from '@rukny/auth/client/session-keepalive';
import { ThemeProvider } from '@/components/theme-provider';
import { AppToastProvider } from '@/components/ui/app-toast-provider';
import { refreshOnce } from '@/lib/api-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AppToastProvider>
        <SessionKeepAlive pathPrefix="/app" refresh={refreshOnce} />
        {children}
      </AppToastProvider>
    </ThemeProvider>
  );
}
