'use client';

import { createContext, useContext, type ReactNode } from 'react';

type DashboardShellVariant = 'default' | 'canvas';

const DashboardShellVariantContext = createContext<DashboardShellVariant>('default');

export function DashboardShellVariantProvider({
  variant,
  children,
}: {
  variant: DashboardShellVariant;
  children: ReactNode;
}) {
  return (
    <DashboardShellVariantContext.Provider value={variant}>
      {children}
    </DashboardShellVariantContext.Provider>
  );
}

export function useDashboardShellVariant() {
  return useContext(DashboardShellVariantContext);
}
