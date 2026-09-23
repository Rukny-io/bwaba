"use client";

import { Spinner as HeroSpinner } from "@heroui/react";
import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

export function Spinner({
  className,
  size = "sm",
  label = "Loading",
}: {
  className?: string;
  size?: SpinnerSize;
  label?: string;
}) {
  return (
    <HeroSpinner
      size={size}
      color="accent"
      aria-label={label}
      className={cn("text-primary", className)}
    />
  );
}
