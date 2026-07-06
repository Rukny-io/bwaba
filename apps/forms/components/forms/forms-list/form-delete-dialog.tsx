'use client';

import { useEffect, useState } from 'react';
import { AlertDialog, Button, Input, Label, TextField } from '@heroui/react';
import { AlertTriangle } from 'lucide-react';
import { fieldInputClass } from '@/components/forms/shared/form-field-input-class';
import { cn } from '@/lib/utils';

const RETENTION_DAYS = 30;

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
  const [confirmTitle, setConfirmTitle] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setConfirmTitle('');
      setReason('');
    }
  }, [isOpen]);

  const titleMatches = confirmTitle.trim() === formTitle.trim();

  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={!busy}
    >
      <AlertDialog.Container size="md">
        <AlertDialog.Dialog>
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Icon status="danger" />
            <AlertDialog.Heading>حذف النموذج؟</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body className="space-y-5">
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                سيتم نقل «{formTitle}» إلى سلة المحذوفات لمدة {RETENTION_DAYS} يوماً.
                بعدها يُحذف النموذج واستجاباته نهائياً.
              </p>
              {submissionCount > 0 ? (
                <div className="flex items-start gap-2.5 rounded-2xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-3.5 py-3">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-[var(--warning)]"
                    aria-hidden
                  />
                  <p className="text-sm leading-relaxed text-[var(--foreground)]">
                    يحتوي هذا النموذج على{' '}
                    <strong className="font-semibold">
                      {submissionCount.toLocaleString('ar')}
                    </strong>{' '}
                    استجابة. ستُحذف مع النموذج عند انتهاء فترة الاحتفاظ.
                  </p>
                </div>
              ) : null}
            </div>
            <div className="space-y-3 border-t border-[var(--border)]/60 pt-4">
              <TextField>
                <Label>اكتب عنوان النموذج للتأكيد</Label>
                <Input
                  value={confirmTitle}
                  onChange={(e) => setConfirmTitle(e.target.value)}
                  placeholder={formTitle}
                  autoComplete="off"
                  dir="auto"
                />
              </TextField>
              {confirmTitle && !titleMatches ? (
                <p className="text-xs text-[var(--danger)]">
                  يجب أن يطابق العنوان تماماً (حساس لحالة الأحرف)
                </p>
              ) : null}
              <TextField>
                <Label htmlFor="delete-reason">سبب الحذف (اختياري)</Label>
                <textarea
                  id="delete-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="مثال: انتهى المشروع"
                  className={cn(
                    fieldInputClass,
                    'w-full resize-none px-3 py-2.5 text-sm leading-relaxed',
                  )}
                />
              </TextField>
            </div>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button variant="tertiary" onPress={() => onOpenChange(false)} isDisabled={busy}>
              إلغاء
            </Button>
            <Button
              variant="danger"
              isDisabled={!titleMatches || busy}
              onPress={() =>
                void onConfirm({
                  confirmTitle: confirmTitle.trim(),
                  reason: reason.trim() || undefined,
                })
              }
            >
              نقل إلى سلة المحذوفات
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
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
  const [confirmTitle, setConfirmTitle] = useState('');

  useEffect(() => {
    if (!isOpen) setConfirmTitle('');
  }, [isOpen]);

  const titleMatches = confirmTitle.trim() === formTitle.trim();
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
    >
      <AlertDialog.Container size="md">
        <AlertDialog.Dialog>
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Icon status="success" />
            <AlertDialog.Heading>استعادة النموذج؟</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body className="space-y-5">
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
              سيتم استعادة «{formTitle}» وإعادته إلى قائمة النماذج النشطة.
              {purgeLabel ? ` الحذف النهائي كان مقرراً في ${purgeLabel}.` : ''}
            </p>
            <div className="border-t border-[var(--border)]/60 pt-4">
              <TextField>
                <Label>اكتب عنوان النموذج للتأكيد</Label>
                <Input
                  value={confirmTitle}
                  onChange={(e) => setConfirmTitle(e.target.value)}
                  placeholder={formTitle}
                  autoComplete="off"
                  dir="auto"
                />
              </TextField>
            </div>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button variant="tertiary" onPress={() => onOpenChange(false)} isDisabled={busy}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              isDisabled={!titleMatches || busy}
              onPress={() => void onConfirm(confirmTitle.trim())}
            >
              استعادة
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
