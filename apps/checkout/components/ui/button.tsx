"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { Button as HeroButton, type ButtonRootProps } from "@heroui/react";
import { cn } from "@/lib/utils";

type ShadcnVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";

type ShadcnSize = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full text-sm font-medium whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-95",
        outline:
          "border border-border bg-background hover:bg-muted hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 px-4",
        xs: "h-6 gap-1 px-2.5 text-xs",
        sm: "h-8 gap-1 px-3",
        lg: "h-10 gap-1.5 px-4",
        icon: "size-9",
        "icon-xs": "size-6",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const variantMap: Record<ShadcnVariant, ButtonRootProps["variant"]> = {
  default: "primary",
  outline: "outline",
  secondary: "secondary",
  ghost: "ghost",
  destructive: "danger",
  link: "ghost",
};

const sizeMap: Record<ShadcnSize, ButtonRootProps["size"]> = {
  default: "md",
  xs: "sm",
  sm: "sm",
  lg: "lg",
  icon: "md",
  "icon-xs": "sm",
  "icon-sm": "sm",
  "icon-lg": "lg",
};

type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: ShadcnVariant;
  size?: ShadcnSize;
  asChild?: boolean;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "default",
    size = "default",
    asChild: _asChild,
    disabled,
    type = "button",
    value,
    ...props
  },
  ref,
) {
  const isIconOnly = size.startsWith("icon");

  return (
    <HeroButton
      ref={ref}
      type={type}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      variant={variantMap[variant]}
      size={sizeMap[size]}
      isDisabled={disabled}
      isIconOnly={isIconOnly}
      {...(value !== undefined ? { value: String(value) } : {})}
      className={cn(
        variant === "link" && "h-auto min-h-0 px-0 underline-offset-4 hover:underline",
        size === "xs" && "text-xs",
        className,
      )}
      {...(props as ButtonRootProps)}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
