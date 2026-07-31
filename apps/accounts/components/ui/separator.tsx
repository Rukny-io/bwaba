"use client";

import * as React from "react";
import { Separator as HeroSeparator } from "@heroui/react";
import { cn } from "@/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}) {
  return (
    <HeroSeparator
      data-slot="separator"
      data-orientation={orientation}
      orientation={orientation}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(className)}
      {...props}
    />
  );
}

export { Separator };
