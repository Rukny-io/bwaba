'use client';

import { Toast } from '@heroui/react';

export function AppToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toast.Provider
        placement="top"
        maxVisibleToasts={4}
        dir="rtl"
        className="app-toast-region mt-6"
      />
    </>
  );
}
