"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ProviderIcon, type ProviderIconId } from "@/components/auth/provider-icons";

export function ManageBrandIcon({
  provider,
  className,
}: {
  provider: ProviderIconId;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-card ring-1 ring-border/60",
        provider === "quicksign" && "bg-muted/80",
        className,
      )}
    >
      <ProviderIcon provider={provider} />
    </div>
  );
}
