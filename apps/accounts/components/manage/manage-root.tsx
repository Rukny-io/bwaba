"use client";

import React from "react";
import { ManageProvider } from "@/lib/manage/context";
import { ManageShell } from "./manage-shell";

export function ManageRoot({ children }: { children: React.ReactNode }) {
  return (
    <ManageProvider>
      <ManageShell>{children}</ManageShell>
    </ManageProvider>
  );
}
