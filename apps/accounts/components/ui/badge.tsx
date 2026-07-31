"use client";

import * as React from "react";
import { Chip } from "@heroui/react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "destructive"
  | "outline"
  | "ghost"
  | "link";

type ChipColor = "danger" | "default" | "accent" | "success";
type ChipVariant = "primary" | "secondary" | "soft" | "tertiary";

const variantMap: Record<BadgeVariant, { variant: ChipVariant; color?: ChipColor }> = {
  default: { variant: "primary", color: "accent" },
  secondary: { variant: "secondary", color: "default" },
  success: { variant: "soft", color: "success" },
  destructive: { variant: "soft", color: "danger" },
  outline: { variant: "tertiary", color: "default" },
  ghost: { variant: "soft", color: "default" },
  link: { variant: "tertiary", color: "accent" },
};

function Badge({
  className,
  variant = "default",
  asChild: _asChild,
  children,
  color: _htmlColor,
  ...props
}: React.ComponentProps<"span"> & {
  variant?: BadgeVariant;
  asChild?: boolean;
}) {
  const mapped = variantMap[variant];
  const color = mapped.color as ChipColor | undefined;

  return (
    <Chip
      data-slot="badge"
      data-variant={variant}
      variant={mapped.variant}
      color={color}
      size="sm"
      className={cn("h-5", className)}
      {...props}
    >
      {children}
    </Chip>
  );
}

export { Badge, variantMap as badgeVariants };
