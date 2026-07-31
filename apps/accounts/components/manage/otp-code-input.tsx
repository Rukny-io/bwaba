"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
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
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid}
      containerClassName={cn("w-full min-w-0 justify-start", className)}
    >
      <InputOTPGroup dir="ltr" className="max-w-full gap-1.5 border-0 shadow-none sm:gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            className="size-10 rounded-xl border border-border bg-background text-base font-semibold first:rounded-xl last:rounded-xl sm:size-11"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
