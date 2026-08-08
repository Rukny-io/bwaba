'use client';

import { useState, type ReactNode } from 'react';
import { AlertDialog, Button } from '@heroui/react';
import { cn } from '@/lib/utils';

const RETENTION_DAYS = 30;

const dialogShellClass =
  'max-w-md overflow-hidden rounded-[1.35rem] border border-[var(--border)]/60 bg-[var(--surface)] p-0 text-start shadow-[var(--card-shadow)]';

const dialogPaddingX = 'px-6';

function FormDialog({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <AlertDialog.Dialog
      dir="rtl"
      lang="ar"
      className={cn(dialogShellClass, className)}
    >
      {children}
    </AlertDialog.Dialog>
  );
}

function DialogTitle({ children }: { children: ReactNode }) {
  return (
    <AlertDialog.Header className={cn(dialogPaddingX, 'pb-0 pt-6')}>
      <AlertDialog.Heading className="text-start text-[1.35rem] font-normal leading-snug text-[var(--foreground)]">
        {children}
      </AlertDialog.Heading>
    </AlertDialog.Header>
  );
}

function DialogActions({ children }: { children: ReactNode }) {
  return (
    <AlertDialog.Footer
      className={cn(
        dialogPaddingX,
        'flex items-center justify-start gap-3 pb-6 pt-5',
      )}
    >
      {children}
    </AlertDialog.Footer>
  );
}

export interface FormDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formTitle: string;
  submissionCount: number;
  busy?: boolean;
  onConfirm: (payload: { confirmTitle: string; reason?: string }) => void | Promise<void>;
}

export function FormDeleteDialog({
  isOpen,
  onOpenChange,
  formTitle,
  submissionCount,
  busy,
  onConfirm,
}: FormDeleteDialogProps) {
  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={!busy}
      variant="blur"
    >
      <AlertDialog.Container placement="center" size="md">
        <FormDialog>
          <AlertDialog.CloseTrigger />

          <DialogTitle>نقل إلى سلة المحذوفات؟</DialogTitle>

          <AlertDialog.Body className={cn(dialogPaddingX, 'space-y-4 pb-2 pt-4')}>
            <p className="text-start text-[14px] leading-[1.65] text-[var(--muted-foreground)]">
              سيُنقل{' '}
              <span dir="auto" className="text-[var(--foreground)]">
                «{formTitle}»
              </span>{' '}
              إلى سلة المحذوفات، ويُحذف نهائياً بعد{' '}
              <span className="tabular-nums text-[var(--foreground)]">
                {RETENTION_DAYS}
              </span>{' '}
              يوماً.
            </p>

            {submissionCount > 0 ? (
              <p className="text-start text-[14px] leading-[1.65] text-[var(--muted-foreground)]">
                يحتوي هذا النموذج على{' '}
                <span className="tabular-nums text-[var(--foreground)]">
                  {submissionCount.toLocaleString('ar')}
                </span>{' '}
                استجابة. ستُحذف مع النموذج عند انتهاء فترة الاحتفاظ.
              </p>
            ) : null}
          </AlertDialog.Body>

          <DialogActions>
            <Button
              variant="danger"
              className="min-w-[7.5rem] rounded-full px-5"
              isDisabled={busy}
              onPress={() =>
                void onConfirm({
                  confirmTitle: formTitle.trim(),
                })
              }
            >
              {busy ? 'جاري النقل…' : 'نقل إلى السلة'}
            </Button>
            <Button
              variant="outline"
              className="rounded-full px-5"
              onPress={() => onOpenChange(false)}
              isDisabled={busy}
            >
              إلغاء
            </Button>
          </DialogActions>
        </FormDialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}

export interface FormRestoreDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formTitle: string;
  purgeScheduledAt?: string | null;
  busy?: boolean;
  onConfirm: (confirmTitle: string) => void | Promise<void>;
}

export function FormRestoreDialog({
  isOpen,
  onOpenChange,
  formTitle,
  purgeScheduledAt,
  busy,
  onConfirm,
}: FormRestoreDialogProps) {
  const purgeLabel = purgeScheduledAt
    ? new Date(purgeScheduledAt).toLocaleDateString('ar', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={!busy}
      variant="blur"
    >
      <AlertDialog.Container placement="center" size="md">
        <FormDialog>
          <AlertDialog.CloseTrigger />

          <DialogTitle>استعادة النموذج؟</DialogTitle>

          <AlertDialog.Body className={cn(dialogPaddingX, 'space-y-4 pb-2 pt-4')}>
            <p className="text-start text-[14px] leading-[1.65] text-[var(--muted-foreground)]">
              سيُعاد{' '}
              <span dir="auto" className="text-[var(--foreground)]">
                «{formTitle}»
              </span>{' '}
              إلى قائمة النماذج النشطة.
              {purgeLabel ? (
                <>
                  {' '}
                  كان الحذف النهائي مقرراً في{' '}
                  <span className="text-[var(--foreground)]">{purgeLabel}</span>.
                </>
              ) : null}
            </p>
          </AlertDialog.Body>

          <DialogActions>
            <Button
              variant="primary"
              className="min-w-[7.5rem] rounded-full px-5"
              isDisabled={busy}
              onPress={() => void onConfirm(formTitle.trim())}
            >
              {busy ? 'جاري الاستعادة…' : 'استعادة'}
            </Button>
            <Button
              variant="outline"
              className="rounded-full px-5"
              onPress={() => onOpenChange(false)}
              isDisabled={busy}
            >
              إلغاء
            </Button>
          </DialogActions>
        </FormDialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
