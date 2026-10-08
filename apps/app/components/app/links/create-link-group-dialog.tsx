'use client';

import { useState } from 'react';
import { FolderPlus, Loader2 } from 'lucide-react';
import { Button } from '@heroui/react';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
];

interface CreateLinkGroupDialogProps {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; nameAr?: string; color: string }) => Promise<void>;
}

export function CreateLinkGroupDialog({
  open,
  busy = false,
  onClose,
  onSubmit,
}: CreateLinkGroupDialogProps) {
  const { t } = useTranslations();
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError(t('linksPage.groupNameTooShort'));
      return;
    }
    setError(null);
    try {
      await onSubmit({ name: trimmed, nameAr: trimmed, color });
      setName('');
      setColor(PRESET_COLORS[0]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('linksPage.createGroupFailed'));
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)]">
            <FolderPlus className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {t('linksPage.groupDialogTitle')}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {t('linksPage.groupDialogHint')}
            </p>
          </div>
        </div>

        <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
          {t('linksPage.groupName')}
        </label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
          placeholder={t('linksPage.groupNamePlaceholder')}
          className="mb-3 h-10 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--foreground)]"
        />

        <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
          {t('linksPage.color')}
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setColor(preset)}
              className={cn(
                'size-7 rounded-full ring-offset-2 ring-offset-[var(--surface)]',
                color === preset && 'ring-2 ring-[var(--foreground)]',
              )}
              style={{ backgroundColor: preset }}
              aria-label={t('linksPage.colorSwatch', { color: preset })}
            />
          ))}
        </div>

        {error ? <p className="mb-3 text-xs text-[var(--danger)]">{error}</p> : null}

        <div className="flex gap-2">
          <Button
            type="submit"
            isDisabled={busy}
            className="h-10 flex-1 rounded-xl bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)]"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : t('linksPage.create')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            isDisabled={busy}
            onPress={onClose}
            className="h-10 rounded-xl px-4 text-sm"
          >
            {t('linksPage.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}
