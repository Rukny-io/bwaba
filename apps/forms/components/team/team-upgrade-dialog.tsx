'use client';

import Link from 'next/link';
import { AlertDialog, Button } from '@heroui/react';
import { planDisplayName } from '@/lib/api/subscriptions';
import { PLUS_PLAN_LABEL } from '@/lib/form-field-plan';
import { ACCOUNTS_URL } from '@/lib/config';

const BILLING_URL = `${ACCOUNTS_URL.replace(/\/$/, '')}/manage/billing`;

interface TeamUpgradeDialogProps {
  open: boolean;
  plan: string;
  onClose: () => void;
  /** رسالة مخصّصة من الـ API عند فشل الدعوة */
  detail?: string | null;
}

export function TeamUpgradeDialog({
  open,
  plan,
  onClose,
  detail,
}: TeamUpgradeDialogProps) {
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
        <AlertDialog.Dialog className="max-w-md overflow-hidden rounded-3xl p-0">
          <AlertDialog.CloseTrigger />

          <AlertDialog.Header className="border-b border-[var(--border)]/60 px-6 pb-4 pt-6">
            <div className="space-y-1 pe-8">
              <AlertDialog.Heading className="text-lg font-semibold leading-snug">
                فريق العمل — باقة {PLUS_PLAN_LABEL}
              </AlertDialog.Heading>
              <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
                ادعُ زملاءك للتعاون على النماذج وحدّد صلاحيات كل عضو.
              </p>
            </div>
          </AlertDialog.Header>

          <AlertDialog.Body className="space-y-4 px-6 py-5">
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
              {detail ??
                `خطتك الحالية (${planDisplayName(plan)}) لا تتضمن فريق العمل. ترقّ إلى باقة ${PLUS_PLAN_LABEL} أو أعلى لدعوة الأعضاء والتحكم بصلاحياتهم.`}
            </p>

            <ul className="space-y-2 rounded-2xl bg-[var(--surface-secondary)]/50 px-4 py-3 text-[12px] text-[var(--muted-foreground)]">
              <li>• بلس: حتى 2 أعضاء</li>
              <li>• الحوت: حتى 5 أعضاء</li>
              <li>• الأعمال: حتى 15 عضو</li>
            </ul>
          </AlertDialog.Body>

          <AlertDialog.Footer className="flex flex-row-reverse items-center justify-start gap-2 border-t border-[var(--border)]/60 bg-[var(--surface-secondary)]/25 px-6 py-4">
            <Link
              href={BILLING_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              ترقية الخطة
            </Link>
            <Button
              variant="outline"
              className="rounded-full px-5"
              onPress={onClose}
            >
              لاحقاً
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
