'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, MessageCircle } from 'lucide-react';
import { InputOTP } from '@heroui/react';
import { FormButton, FormTextField } from '@/components/public-form/ui';
import { cn } from '@/lib/utils';

interface FieldOtpVerificationProps {
  channelLabel: string;
  sendLabel: string;
  confirmLabel: string;
  verifiedLabel: string;
  value: string;
  onValueChange: (value: string) => void;
  inputType?: 'email' | 'tel';
  placeholder?: string;
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
  onSend: () => Promise<{ ok: boolean; message?: string }>;
  onConfirm: (code: string) => Promise<{ ok: boolean; message?: string }>;
  themed?: boolean;
  error?: string | null;
}

export function FieldOtpVerification({
  channelLabel,
  sendLabel,
  confirmLabel,
  verifiedLabel,
  value,
  onValueChange,
  inputType = 'email',
  placeholder,
  verified,
  onVerifiedChange,
  onSend,
  onConfirm,
  themed,
  error,
}: FieldOtpVerificationProps) {
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const onVerifiedChangeRef = useRef(onVerifiedChange);
  onVerifiedChangeRef.current = onVerifiedChange;

  useEffect(() => {
    onVerifiedChangeRef.current(false);
    setSent(false);
    setCode('');
    setLocalError(null);
  }, [value]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const ic = themed
    ? 'pf-input w-full border border-[color:var(--form-input-border)] bg-white px-3.5 py-3 text-sm text-[color:var(--form-input-text)] outline-none transition-[border-color,box-shadow] placeholder:text-[color:var(--form-text-placeholder)] focus:outline-none'
    : 'w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none';

  async function handleSend() {
    if (!value.trim() || sending || cooldown > 0) return;
    setSending(true);
    setLocalError(null);
    const result = await onSend();
    setSending(false);
    if (result.ok) {
      setSent(true);
      setCooldown(60);
    } else {
      setLocalError(result.message ?? 'تعذّر إرسال الرمز');
    }
  }

  async function handleConfirm(nextCode?: string) {
    const otp = (nextCode ?? code).trim();
    if (!otp || confirming) return;
    setConfirming(true);
    setLocalError(null);
    const result = await onConfirm(otp);
    setConfirming(false);
    if (result.ok) {
      onVerifiedChange(true);
      setLocalError(null);
    } else {
      setLocalError(result.message ?? 'رمز غير صحيح');
    }
  }

  const displayError = error ?? localError;

  return (
    <div className="pf-verification mt-3 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        {themed ? (
          <FormTextField
            id={`otp-channel-${inputType}`}
            label=""
            value={value}
            onChange={onValueChange}
            type={inputType}
            placeholder={placeholder}
            disabled={verified}
            dir={inputType === 'tel' ? 'ltr' : undefined}
            className="min-w-0 flex-1 [&_[data-slot=label]]:hidden"
          />
        ) : (
          <input
            type={inputType}
            dir={inputType === 'tel' ? 'ltr' : undefined}
            className={cn(ic, 'min-w-0 flex-1')}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            disabled={verified}
          />
        )}
        {!verified ? (
          <FormButton
            type="button"
            variant="outline"
            onPress={() => void handleSend()}
            isDisabled={!value.trim() || sending || cooldown > 0}
            className="w-full shrink-0 sm:w-auto"
          >
            {sending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <MessageCircle className="size-3.5" />
            )}
            {cooldown > 0 ? `${cooldown}ث` : sendLabel}
          </FormButton>
        ) : null}
      </div>

      {verified ? (
        <p className="pf-verification__verified inline-flex items-center gap-1.5 text-xs font-medium">
          <CheckCircle2 className="size-3.5" />
          {verifiedLabel}
        </p>
      ) : sent ? (
        <div className="rounded-xl border border-[color:var(--form-input-border)] bg-[color-mix(in_srgb,var(--form-primary)_5%,white)] p-3.5">
          <p className="text-xs text-[color:var(--form-text-body)]">
            أرسلنا رمز التحقق عبر {channelLabel}. أدخل الرمز المكوّن من 6 أرقام.
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            {themed ? (
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(next) => {
                  setCode(next);
                  if (next.length === 6) void handleConfirm(next);
                }}
                className="form-heroui-otp"
                inputMode="numeric"
              >
                <InputOTP.Group>
                  {[0, 1, 2].map((i) => (
                    <InputOTP.Slot key={i} index={i} />
                  ))}
                </InputOTP.Group>
                <InputOTP.Separator />
                <InputOTP.Group>
                  {[3, 4, 5].map((i) => (
                    <InputOTP.Slot key={i} index={i} />
                  ))}
                </InputOTP.Group>
              </InputOTP>
            ) : (
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                dir="ltr"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="••••••"
                className={cn(
                  ic,
                  'max-w-[10rem] text-center font-mono text-lg tracking-[0.25em]',
                )}
              />
            )}
            <FormButton
              type="button"
              variant="primary"
              onPress={() => void handleConfirm()}
              isDisabled={code.length < 6 || confirming}
              className="w-full sm:w-auto"
            >
              {confirming ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                confirmLabel
              )}
            </FormButton>
          </div>
        </div>
      ) : null}

      {displayError ? (
        <p className="text-xs text-red-600" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  );
}
