'use client';

import { CreditCard } from 'lucide-react';
import { AlertDialog, Button } from '@heroui/react';
import { useTranslations } from '@/components/providers/translations-provider';
import { formatIqd } from '@/lib/wallet-format';

interface WalletTopUpConfirmDialogProps {
  open: boolean;
  amount: number | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function WalletTopUpConfirmDialog({
  open,
  amount,
  isPending,
  onOpenChange,
  onConfirm,
}: WalletTopUpConfirmDialogProps) {
  const t = useTranslations();
  const w = t.wallet;
  const currency = t.dashboard.iqd;

  const formattedAmount =
    amount != null ? formatIqd(amount, currency) : '';

  return (
    <AlertDialog.Backdrop
      isOpen={open}
      onOpenChange={(next) => {
        if (isPending) return;
        onOpenChange(next);
      }}
      variant="blur"
    >
      <AlertDialog.Container>
        <AlertDialog.Dialog className="sm:max-w-[400px]">
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Icon status="accent">
              <CreditCard className="size-5" aria-hidden />
            </AlertDialog.Icon>
            <AlertDialog.Heading>{w.topUpConfirmTitle}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
              {w.topUpConfirmBody.replace('{amount}', formattedAmount)}
            </p>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button
              slot="close"
              variant="tertiary"
              isDisabled={isPending}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              isDisabled={isPending || amount == null}
              onPress={() => onConfirm()}
            >
              {isPending ? w.topUpContinuing : w.topUpConfirmAction}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
