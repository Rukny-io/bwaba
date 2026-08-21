"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

interface OtpCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}

export function OtpCodeInput({
  value,
  onChange,
  disabled,
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: OtpCodeInputProps) {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={onChange}
      disabled={disabled}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid}
      containerClassName={cn("w-full min-w-0 justify-center", className)}
    >
      <InputOTPGroup
        dir="ltr"
        className="max-w-full gap-2 border-0 bg-transparent shadow-none sm:gap-2.5"
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            className={cn(
              "size-11 rounded-xl border border-border/80 bg-background text-lg font-semibold tabular-nums shadow-none",
              "first:rounded-xl last:rounded-xl first:border-s last:border-e",
              "data-[active=true]:border-foreground/40 data-[active=true]:ring-2 data-[active=true]:ring-foreground/10",
              "sm:size-12",
            )}
          />
        ))}
        <InputOTPSeparator className="mx-0.5 text-muted-foreground/50" />
        {Array.from({ length: 3 }).map((_, index) => (
          <InputOTPSlot
            key={index + 3}
            index={index + 3}
            className={cn(
              "size-11 rounded-xl border border-border/80 bg-background text-lg font-semibold tabular-nums shadow-none",
              "first:rounded-xl last:rounded-xl first:border-s last:border-e",
              "data-[active=true]:border-foreground/40 data-[active=true]:ring-2 data-[active=true]:ring-foreground/10",
              "sm:size-12",
            )}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
