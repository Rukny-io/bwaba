import type { ReactNode } from 'react';
import { DashboardShellVariantProvider } from '@/components/app/dashboard-shell-variant';

export default function WorkflowsLayout({ children }: { children: ReactNode }) {
  return <DashboardShellVariantProvider variant="canvas">{children}</DashboardShellVariantProvider>;
}
