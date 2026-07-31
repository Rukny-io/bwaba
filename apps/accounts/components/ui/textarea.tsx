"use client";

import * as React from "react";
import { TextArea, TextField } from "@heroui/react";
import { cn } from "@/lib/utils";

function Textarea({
  className,
  id,
  name,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<"textarea">) {
  const label = ariaLabel || name || id || "textarea";

  return (
    <TextField
      aria-label={typeof label === "string" ? label : "textarea"}
      className={cn("w-full", className)}
      fullWidth
    >
      <TextArea id={id} name={name} {...props} />
    </TextField>
  );
}

export { Textarea };
