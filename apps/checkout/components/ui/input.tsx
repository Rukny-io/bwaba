"use client";

import * as React from "react";
import { Input as HeroInput, TextField } from "@heroui/react";
import { cn } from "@/lib/utils";

function Input({
  className,
  id,
  name,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<"input">) {
  const label = ariaLabel || name || id || "input";

  return (
    <TextField
      aria-label={typeof label === "string" ? label : "input"}
      className={cn("w-full", className)}
      fullWidth
    >
      <HeroInput id={id} name={name} {...props} />
    </TextField>
  );
}

export { Input };
