"use client";

import * as React from "react";
import { Label as HeroLabel } from "@heroui/react";
import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <HeroLabel
      data-slot="label"
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  );
}

export { Label };
