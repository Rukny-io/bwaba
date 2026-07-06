'use client';

import { AlertDialog, Button } from '@heroui/react';
import { Crown } from 'lucide-react';
import {
  planDisplayName,
  planFeatureLabel,
} from '@/lib/api/subscriptions';
import { PLUS_PLAN_LABEL } from '@/lib/form-field-plan';

type VerificationFeature =
  | 'emailFieldVerification'
  | 'phoneWhatsappVerification';

const FEATURE_DESCRIPTIONS: Record<VerificationFeature, string> = {
  emailFieldVerification:
    'يرسل رمز OTP إلى بريد المستجيب ويجب تأكيده قبل إرسال النموذج.',
  phoneWhatsappVerification:
    'يرسل رمز تحقق عبر WhatsApp إلى رقم المستجيب ويجب تأكيده قبل الإرسال.',
};

interface VerificationUpgradeDialogProps {
  open: boolean;
  feature: VerificationFeature;
  plan: string;
  onClose: () => void;
}

export function VerificationUpgradeDialog({
  open,
  feature,
  plan,
  onClose,
}: VerificationUpgradeDialogProps) {
  return (
    <AlertDialog.Backdrop
      isDismissable
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      variant="blur"
    >
      <AlertDialog.Container placement="center" size="md">
        <AlertDialog.Dialog className="max-w-md rounded-3xl p-6">
          <AlertDialog.Header>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                <Crown className="size-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <AlertDialog.Heading className="text-base">
                  {planFeatureLabel(feature)} — باقة {PLUS_PLAN_LABEL}
                </AlertDialog.Heading>
                <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {FEATURE_DESCRIPTIONS[feature]}
                </p>
              </div>
            </div>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
              خطتك الحالية ({planDisplayName(plan)}) لا تتضمن هذه الميزة.
              ترقّ إلى باقة{' '}
              <span className="font-semibold text-[var(--foreground)]">
                {PLUS_PLAN_LABEL}
              </span>{' '}
              لتفعيل التحقق.
            </p>
          </AlertDialog.Body>
          <AlertDialog.Footer className="gap-2">
            <Button variant="primary" onPress={onClose} className="rounded-full">
              حسناً
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
