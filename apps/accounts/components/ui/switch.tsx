"use client";

import * as React from "react";
import { Switch as HeroSwitch } from "@heroui/react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

function Switch({
  checked = false,
  onCheckedChange,
  disabled,
  className,
  id,
}: SwitchProps) {
  return (
    <HeroSwitch
      id={id}
      isSelected={checked}
      onChange={(value) => {
        if (!disabled) onCheckedChange?.(value);
      }}
      isDisabled={disabled}
      className={cn(className)}
    >
      <HeroSwitch.Control>
        <HeroSwitch.Thumb />
      </HeroSwitch.Control>
    </HeroSwitch>
  );
}

export { Switch };
