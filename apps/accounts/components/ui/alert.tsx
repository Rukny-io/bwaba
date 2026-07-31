"use client";

import * as React from "react";
import { Alert as HeroAlert } from "@heroui/react";
import { cn } from "@/lib/utils";

function Alert({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "destructive";
}) {
  return (
    <HeroAlert
      role="alert"
      data-slot="alert"
      status={variant === "destructive" ? "danger" : "default"}
      className={cn("w-full", className)}
      {...props}
    >
      <HeroAlert.Indicator />
      <HeroAlert.Content>
        {typeof children === "string" ? (
          <HeroAlert.Description>{children}</HeroAlert.Description>
        ) : (
          children
        )}
      </HeroAlert.Content>
    </HeroAlert>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <HeroAlert.Title
      data-slot="alert-title"
      className={cn(className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <HeroAlert.Description
      data-slot="alert-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2.5 end-3", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
