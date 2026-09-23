'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { Button, Checkbox, Chip, Label } from '@heroui/react';
import type { AdminMailAppDetail, MailAppType } from '@/lib/types/mail';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import {
  formatMailAppStatus,
  formatMailAppType,
  mailAppStatusChipColor,
} from '@/lib/mail-format';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FilterDropdown } from '@/components/shared/filter-dropdown';
import { detailPanelClassName } from '@/components/ui/pill-tab';

const fieldClassName =
  'h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]';

const textAreaClassName =
  'w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]';

const APP_TYPE_OPTIONS: { value: MailAppType; label: string }[] = [
  { value: 'BUSINESS', label: 'Business' },
  { value: 'CONSUMER', label: 'Consumer' },
];

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

interface MailAppActionsPanelProps {
  app: AdminMailAppDetail;
  onUpdated: () => Promise<void> | void;
}

export function MailAppActionsPanel({ app, onUpdated }: MailAppActionsPanelProps) {
  const router = useRouter();
  const [name, setName] = useState(app.name);
  const [contactEmail, setContactEmail] = useState(app.contactEmail ?? '');
  const [description, setDescription] = useState(app.description ?? '');
  const [appType, setAppType] = useState<MailAppType>(
    (app.appType as MailAppType) === 'CONSUMER' ? 'CONSUMER' : 'BUSINESS',
  );
  const [bodyEncryptionEnabled, setBodyEncryptionEnabled] = useState(
    Boolean(app.bodyEncryptionEnabled),
  );
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setName(app.name);
    setContactEmail(app.contactEmail ?? '');
    setDescription(app.description ?? '');
    setAppType(
      (app.appType as MailAppType) === 'CONSUMER' ? 'CONSUMER' : 'BUSINESS',
    );
    setBodyEncryptionEnabled(Boolean(app.bodyEncryptionEnabled));
  }, [
    app.name,
    app.contactEmail,
    app.description,
    app.appType,
    app.bodyEncryptionEnabled,
  ]);

  const dirty =
    name.trim() !== app.name ||
    contactEmail.trim() !== (app.contactEmail ?? '') ||
    description.trim() !== (app.description ?? '') ||
    appType !== app.appType ||
    bodyEncryptionEnabled !== Boolean(app.bodyEncryptionEnabled);

  const isArchived = app.status === 'ARCHIVED';

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedEmail = contactEmail.trim();
    if (trimmedName.length < 2) {
      appToast.error('Name must be at least 2 characters');
      return;
    }
    if (!looksLikeEmail(trimmedEmail)) {
      appToast.error('Enter a valid contact email');
      return;
    }

    setSaving(true);
    try {
      await hqApi.updateMailApp(app.appId, {
        name: trimmedName,
        contactEmail: trimmedEmail,
        description: description.trim() || null,
        appType,
        bodyEncryptionEnabled,
      });
      appToast.success('Mail app updated');
      await onUpdated();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not update Mail app',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusToggle() {
    setStatusLoading(true);
    try {
      await hqApi.updateMailApp(app.appId, {
        status: isArchived ? 'ACTIVE' : 'ARCHIVED',
      });
      appToast.success(isArchived ? 'Mail app restored' : 'Mail app archived');
      await onUpdated();
    } catch (error) {
      appToast.error(
        error instanceof ApiException
          ? error.message
          : 'Could not update app status',
      );
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await hqApi.deleteMailApp(app.appId);
      appToast.success('Mail app deleted');
      router.replace('/app/mail');
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not delete Mail app',
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className={detailPanelClassName}>
        <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">
          Customize app
        </h2>
        <p className="mb-4 text-xs text-[var(--muted-foreground)]">
          Edit workspace identity and encryption settings. Changes apply immediately for
          the owner and team.
        </p>

        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 text-xs text-[var(--muted-foreground)]">
              Application name
            </Label>
            <input
              className={fieldClassName}
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div>
            <Label className="mb-1.5 text-xs text-[var(--muted-foreground)]">
              Official contact email
            </Label>
            <input
              className={fieldClassName}
              type="email"
              dir="ltr"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
            />
          </div>

          <div>
            <Label className="mb-1.5 text-xs text-[var(--muted-foreground)]">
              Description
            </Label>
            <textarea
              className={textAreaClassName}
              rows={3}
              maxLength={280}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <FilterDropdown
            label="App type"
            value={appType}
            options={APP_TYPE_OPTIONS}
            onChange={(value) =>
              setAppType(value === 'CONSUMER' ? 'CONSUMER' : 'BUSINESS')
            }
            size="sm"
          />

          <div className="rounded-2xl bg-[var(--surface-secondary)] px-3 py-3">
            <Checkbox
              isSelected={bodyEncryptionEnabled}
              onChange={setBodyEncryptionEnabled}
            >
              Body encryption enabled
            </Checkbox>
            <p className="mt-1.5 ps-7 text-[11px] text-[var(--muted-foreground)]">
              When platform encryption is on, new message bodies for this app are
              envelope-encrypted.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="rounded-xl"
            isDisabled={!dirty || saving}
            onPress={() => void handleSave()}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Save changes
          </Button>
          {dirty ? (
            <Button
              size="sm"
              variant="tertiary"
              className="rounded-xl"
              isDisabled={saving}
              onPress={() => {
                setName(app.name);
                setContactEmail(app.contactEmail ?? '');
                setDescription(app.description ?? '');
                setAppType(
                  (app.appType as MailAppType) === 'CONSUMER'
                    ? 'CONSUMER'
                    : 'BUSINESS',
                );
                setBodyEncryptionEnabled(Boolean(app.bodyEncryptionEnabled));
              }}
            >
              Reset
            </Button>
          ) : null}
        </div>
      </section>

      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Status</h2>
        <div className="rounded-2xl bg-[var(--surface-secondary)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Chip color={mailAppStatusChipColor(app.status)} size="sm" variant="soft">
                {formatMailAppStatus(app.status)}
              </Chip>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                {isArchived
                  ? 'Archived apps are hidden from the owner picker. Mailboxes are kept.'
                  : `Type: ${formatMailAppType(app.appType)}. Archive hides the workspace without wiping mailboxes.`}
              </p>
            </div>
            <Button
              variant="tertiary"
              size="sm"
              className="rounded-xl"
              isDisabled={statusLoading}
              onPress={() => setConfirmArchive(true)}
            >
              {statusLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isArchived ? (
                <RotateCcw className="size-4" />
              ) : (
                <Archive className="size-4" />
              )}
              {isArchived ? 'Restore app' : 'Archive app'}
            </Button>
          </div>
        </div>
      </section>

      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Danger zone</h2>
        <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-4">
          <p className="text-sm text-[var(--foreground)]">Delete app permanently</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Removes this Mail app, mailboxes, messages, aliases, and subscription data.
            This cannot be undone.
          </p>
          <Button
            variant="danger"
            size="sm"
            className="mt-4 rounded-xl"
            isDisabled={deleteLoading}
            onPress={() => setConfirmDelete(true)}
          >
            {deleteLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Delete app
          </Button>
        </div>
      </section>

      <ConfirmDialog
        isOpen={confirmArchive}
        onOpenChange={setConfirmArchive}
        title={isArchived ? 'Restore Mail app?' : 'Archive Mail app?'}
        description={
          isArchived
            ? `Restore "${app.name}" so the owner can open it again?`
            : `Archive "${app.name}"? It will leave the owner picker. Mailboxes are not wiped.`
        }
        confirmLabel={isArchived ? 'Restore' : 'Archive'}
        isLoading={statusLoading}
        onConfirm={handleStatusToggle}
      />

      <ConfirmDialog
        isOpen={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete Mail app?"
        description={`Permanently delete "${app.name}" (${app.appId}) and all related mail data? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
