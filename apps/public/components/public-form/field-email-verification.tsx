'use client';

import {
  confirmEmailVerificationCode,
  sendEmailVerificationCode,
} from '@/lib/public-form-api';
import { FieldOtpVerification } from '@/components/public-form/field-otp-verification';

export function FieldEmailVerification({
  slug,
  fieldId,
  value,
  onChange,
  placeholder,
  verified,
  onVerifiedChange,
  themed,
  error,
}: {
  slug: string;
  fieldId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
  themed?: boolean;
  error?: string | null;
}) {
  return (
    <FieldOtpVerification
      channelLabel="البريد الإلكتروني"
      sendLabel="إرسال الرمز"
      confirmLabel="تأكيد"
      verifiedLabel="تم تأكيد البريد الإلكتروني"
      value={value}
      onValueChange={onChange}
      inputType="email"
      placeholder={placeholder}
      verified={verified}
      onVerifiedChange={onVerifiedChange}
      themed={themed}
      error={error}
      onSend={async () => {
        const result = await sendEmailVerificationCode(
          slug,
          fieldId,
          value.trim().toLowerCase(),
        );
        return result.ok
          ? { ok: true }
          : { ok: false, message: result.message };
      }}
      onConfirm={async (code) => {
        const result = await confirmEmailVerificationCode(
          slug,
          value.trim().toLowerCase(),
          code,
        );
        return result.ok
          ? { ok: true }
          : { ok: false, message: result.message };
      }}
    />
  );
}
