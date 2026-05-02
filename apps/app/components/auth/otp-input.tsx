'use client';

import { InputOTP } from '@heroui/react';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  isDisabled?: boolean;
  autoFocus?: boolean;
}

/**
 * حقل إدخال رمز OTP (6 خانات).
 * يستخدم InputOTP من مكتبة HeroUI v3.
 */
export function OTPInput({
  value,
  onChange,
  length = 6,
  isDisabled = false,
  autoFocus = true,
}: OTPInputProps) {
  return (
    <div dir="ltr">
    <InputOTP
      maxLength={length}
      value={value}
      onChange={onChange}
      isDisabled={isDisabled}
      autoFocus={autoFocus}
      className="justify-center"
      dir="ltr"
    >
      <InputOTP.Group>
        <InputOTP.Slot index={0} />
        <InputOTP.Slot index={1} />
        <InputOTP.Slot index={2} />
      </InputOTP.Group>
      <InputOTP.Separator />
      <InputOTP.Group>
        <InputOTP.Slot index={3} />
        <InputOTP.Slot index={4} />
        <InputOTP.Slot index={5} />
      </InputOTP.Group>
    </InputOTP>
    </div>
  );
}
