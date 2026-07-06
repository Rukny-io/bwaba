'use client';

import { useState } from 'react';
import {
  AlertDialog,
  Button,
  Input,
  Label,
  TextField,
} from '@heroui/react';
import { UserPlus } from 'lucide-react';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { fieldInputClass } from '@/components/forms/shared/form-field-input-class';
import type { FormTeamRole } from '@/lib/form-team-api';
import { FormTeamRoleSelect } from '@/components/team/form-team-role-select';
import { cn } from '@/lib/utils';

interface TeamInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: FormTeamRole) => Promise<void>;
}

export function TeamInviteDialog({
  open,
  onOpenChange,
  onInvite,
}: TeamInviteDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<FormTeamRole>('EDITOR');
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setEmail('');
      setRole('EDITOR');
    }
    onOpenChange(next);
  }

  async function handleSubmit() {
    const trimmed = email.trim();
    if (!trimmed) {
      appToast.error('أدخل البريد الإلكتروني');
      return;
    }

    setSubmitting(true);
    try {
      await onInvite(trimmed, role);
    } catch (e) {
      appToast.error(getApiErrorMessage(e, 'تعذّر إرسال الدعوة'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog.Backdrop
      isOpen={open}
      onOpenChange={handleOpenChange}
      isDismissable
      variant="blur"
    >
      <AlertDialog.Container placement="center" size="md">
        <AlertDialog.Dialog className="max-w-md overflow-hidden rounded-3xl p-0">
          <AlertDialog.CloseTrigger />

          <AlertDialog.Header className="border-b border-[var(--border)]/60 px-6 pb-4 pt-6">
            <div className="flex items-start gap-3 pe-8">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--foreground)]">
                <UserPlus className="size-5" strokeWidth={1.6} aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <AlertDialog.Heading className="text-lg font-semibold leading-snug">
                  دعوة عضو للفريق
                </AlertDialog.Heading>
                <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
                  أرسل دعوة بالبريد الإلكتروني وحدّد صلاحيات الوصول.
                </p>
              </div>
            </div>
          </AlertDialog.Header>

          <AlertDialog.Body className="space-y-5 px-6 py-5">
            <TextField>
              <Label className="text-sm font-medium">البريد الإلكتروني</Label>
              <Input
                type="email"
                placeholder="member@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                className={cn(fieldInputClass, 'mt-1.5 px-3 py-2.5 text-sm')}
                autoComplete="email"
              />
              <p className="mt-1.5 text-[12px] text-[var(--muted-foreground)]">
                يجب أن يكون المدعو مسجّلاً في Rukny.
              </p>
            </TextField>

            <div>
              <Label htmlFor="team-invite-role" className="text-sm font-medium">
                الدور
              </Label>
              <FormTeamRoleSelect
                id="team-invite-role"
                value={role}
                onChange={setRole}
                showDescription
                className="mt-1.5"
                aria-label="دور العضو"
              />
            </div>
          </AlertDialog.Body>

          <AlertDialog.Footer className="flex flex-row-reverse justify-start gap-2 border-t border-[var(--border)]/60 bg-[var(--surface-secondary)]/25 px-6 py-4">
            <Button
              variant="primary"
              className="rounded-full px-5"
              isDisabled={submitting}
              onPress={() => void handleSubmit()}
            >
              {submitting ? 'جاري الإرسال…' : 'إرسال الدعوة'}
            </Button>
            <Button
              variant="outline"
              className="rounded-full px-5"
              isDisabled={submitting}
              onPress={() => handleOpenChange(false)}
            >
              إلغاء
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
