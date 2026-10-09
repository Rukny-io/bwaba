'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LifeBuoy } from 'lucide-react';
import {
  AlertDialog,
  Button,
  Input,
  Label,
  TextArea,
  TextField,
} from '@heroui/react';
import { useTranslations } from '@/components/providers/translations-provider';
import { FormDropdown } from '@/components/ui/form-dropdown';
import { createSupportTicket } from '@/lib/api/support-tickets';
import type { SupportTicketCategory } from '@/lib/api/types';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';

const CATEGORIES: SupportTicketCategory[] = [
  'ACCOUNT',
  'BILLING',
  'TECHNICAL',
  'FEATURE_REQUEST',
  'OTHER',
];

const INITIAL_FORM = {
  subject: '',
  description: '',
  category: 'TECHNICAL' as SupportTicketCategory,
};

interface SupportCreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId?: string;
}

export function SupportCreateTicketDialog({
  open,
  onOpenChange,
  appId,
}: SupportCreateTicketDialogProps) {
  const t = useTranslations();
  const st = t.supportTicket;
  const pathname = usePathname();

  const [subject, setSubject] = useState(INITIAL_FORM.subject);
  const [description, setDescription] = useState(INITIAL_FORM.description);
  const [category, setCategory] = useState<SupportTicketCategory>(
    INITIAL_FORM.category,
  );
  const [busy, setBusy] = useState(false);

  const resetForm = useCallback(() => {
    setSubject(INITIAL_FORM.subject);
    setDescription(INITIAL_FORM.description);
    setCategory(INITIAL_FORM.category);
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
      setBusy(false);
    }
  }, [open, resetForm]);

  const categoryOptions = useMemo(
    () =>
      CATEGORIES.map((id) => ({
        id,
        label: st.category[id],
      })),
    [st.category],
  );

  const canSubmit =
    subject.trim().length >= 3 &&
    description.trim().length >= 10 &&
    !busy;

  async function handleSubmit() {
    if (!canSubmit) return;

    setBusy(true);
    try {
      const ticket = await createSupportTicket({
        subject: subject.trim(),
        description: description.trim(),
        category,
        context: {
          source: 'developer-portal',
          ...(appId ? { appId } : {}),
          page: pathname,
          locale: t.common.locale,
          userAgent:
            typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        },
      });
      appToast.success(st.success.replace('{number}', ticket.number));
      onOpenChange(false);
    } catch (error) {
      appToast.error(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog.Backdrop
      isOpen={open}
      onOpenChange={(next) => {
        if (busy) return;
        onOpenChange(next);
      }}
      variant="blur"
    >
      <AlertDialog.Container>
        <AlertDialog.Dialog className="sm:max-w-[440px]">
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Icon status="accent">
              <LifeBuoy className="size-5" aria-hidden />
            </AlertDialog.Icon>
            <AlertDialog.Heading>{st.title}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p className="mb-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
              {st.description}
            </p>
            <div className="flex flex-col gap-4">
              <FormDropdown
                label={st.fieldCategory}
                value={category}
                options={categoryOptions}
                onChange={(value) =>
                  setCategory(value as SupportTicketCategory)
                }
              />

              <TextField
                isRequired
                value={subject}
                onChange={setSubject}
                maxLength={200}
              >
                <Label>{st.fieldSubject}</Label>
                <Input
                  placeholder={st.fieldSubjectPlaceholder}
                  autoComplete="off"
                />
              </TextField>

              <TextField
                isRequired
                value={description}
                onChange={setDescription}
                maxLength={5000}
              >
                <Label>{st.fieldDescription}</Label>
                <TextArea
                  rows={5}
                  placeholder={st.fieldDescriptionPlaceholder}
                  className="min-h-[120px]"
                />
              </TextField>
            </div>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button slot="close" variant="tertiary" isDisabled={busy}>
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              isDisabled={!canSubmit}
              onPress={() => handleSubmit()}
            >
              {busy ? st.submitting : st.submit}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
