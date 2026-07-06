'use client';

import { Toast } from '@heroui/react';

export function AppToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toast.Provider
        placement="top"
        maxVisibleToasts={4}
        dir="ltr"
        className="mt-6"
      />
    </>
  );
}
