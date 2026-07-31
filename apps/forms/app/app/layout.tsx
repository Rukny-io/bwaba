import type { ReactNode } from 'react';

/** Root /app layout — dashboard shell lives in (dashboard); create flow in (standalone). */
export default function AppLayout({ children }: { children: ReactNode }) {
  return children;
}
