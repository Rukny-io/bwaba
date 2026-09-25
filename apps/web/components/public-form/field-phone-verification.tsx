'use client';

import {
  confirmPhoneVerificationCode,
  sendPhoneVerificationCode,
} from '@/lib/public-form-api';
import { FieldOtpVerification } from '@/components/public-form/field-otp-verification';

export function FieldPhoneVerification({
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
      channelLabel="WhatsApp"
      sendLabel="إرسال عبر WhatsApp"
      confirmLabel="تأكيد"
      verifiedLabel="تم تأكيد رقم الهاتف"
      value={value}
      onValueChange={onChange}
      inputType="tel"
      placeholder={placeholder ?? '+9647XXXXXXXX'}
      verified={verified}
      onVerifiedChange={onVerifiedChange}
      themed={themed}
      error={error}
      onSend={async () => {
        const result = await sendPhoneVerificationCode(slug, fieldId, value.trim());
        return result.ok
          ? { ok: true }
          : { ok: false, message: result.message };
      }}
      onConfirm={async (code) => {
        const result = await confirmPhoneVerificationCode(slug, value.trim(), code);
        return result.ok
          ? { ok: true }
          : { ok: false, message: result.message };
      }}
    />
  );
}
