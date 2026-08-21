"use client";

import { I18nProvider, RouterProvider } from "@heroui/react";
import { useRouter } from "next/navigation";
import { ThemeSync } from "@/components/theme-sync";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <I18nProvider locale="en-US">
      <RouterProvider navigate={router.push}>
        <ThemeSync />
        {children}
      </RouterProvider>
    </I18nProvider>
  );
}
