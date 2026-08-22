'use client';

import { useState } from 'react';
import { Button, Chip } from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type { AdminMailMailbox } from '@/lib/types/mail';
import {
  formatMailDateTime,
  formatMailMailboxStatus,
  formatMailStorage,
  mailMailboxStatusChipColor,
} from '@/lib/mail-format';
import { detailPanelClassName } from '@/components/ui/pill-tab';

export function MailAppMailboxesPanel({
  mailboxes,
  loading,
  onChanged,
}: {
  mailboxes: AdminMailMailbox[];
  loading?: boolean;
  onChanged: () => Promise<void> | void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggle(mailbox: AdminMailMailbox) {
    const next = mailbox.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    setBusyId(mailbox.id);
    try {
      await hqApi.updateMailMailboxStatus(mailbox.id, next);
      appToast.success(next === 'DISABLED' ? 'Mailbox disabled' : 'Mailbox enabled');
      await onChanged();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not update mailbox status',
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />;
  }

  if (mailboxes.length === 0) {
    return (
      <section className={detailPanelClassName}>
        <p className="text-sm text-[var(--muted-foreground)]">No mailboxes on this app.</p>
      </section>
    );
  }

  return (
    <section className={detailPanelClassName}>
      <h2 className="mb-3 text-sm font-semibold">Mailboxes</h2>
      <ul className="divide-y divide-[var(--border)]/60">
        {mailboxes.map((box) => (
          <li key={box.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" dir="ltr">
                {box.address}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {box.displayName || 'No display name'} · {formatMailStorage(box.storageUsedBytes)} ·{' '}
                {formatMailDateTime(box.createdAt)}
              </p>
            </div>
            <Chip color={mailMailboxStatusChipColor(box.status)} size="sm" variant="soft">
              {formatMailMailboxStatus(box.status)}
            </Chip>
            <Button
              size="sm"
              variant="tertiary"
              className="rounded-lg"
              isDisabled={busyId === box.id}
              onPress={() => void toggle(box)}
            >
              {box.status === 'ACTIVE' ? 'Disable' : 'Enable'}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
