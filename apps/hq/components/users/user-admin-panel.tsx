'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, StickyNote } from 'lucide-react';
import { Button } from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type { AdminUserActivityItem, AdminUserNote } from '@/lib/types/users';
import {
  formatSecurityAction,
  formatUserDateTime,
} from '@/lib/users-format';
import { detailPanelClassName } from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

interface UserAdminPanelProps {
  userId: string;
}

export function UserAdminPanel({ userId }: UserAdminPanelProps) {
  const [notes, setNotes] = useState<AdminUserNote[]>([]);
  const [activity, setActivity] = useState<AdminUserActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [notesRes, activityRes] = await Promise.all([
        hqApi.getUserNotes(userId),
        hqApi.getUserAdminActivity(userId),
      ]);
      setNotes(notesRes);
      setActivity(activityRes);
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load admin data',
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleAddNote() {
    const trimmed = noteDraft.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await hqApi.addUserNote(userId, trimmed);
      setNoteDraft('');
      appToast.success('Note added');
      await loadData();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not add note',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={detailPanelClassName}>
        <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">
          Admin notes
        </h2>
        <p className="mb-4 text-xs text-[var(--muted-foreground)]">
          Internal notes visible only to HQ admins.
        </p>

        <div className="mb-4 space-y-2">
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Add an internal note…"
            rows={3}
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 text-sm"
          />
          <Button
            size="sm"
            className="rounded-xl"
            isDisabled={saving || !noteDraft.trim()}
            onPress={() => void handleAddNote()}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <StickyNote className="size-4" />}
            Add note
          </Button>
        </div>

        {notes.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No notes yet.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((item) => (
              <li
                key={item.id}
                className="rounded-xl bg-[var(--surface-secondary)] px-3 py-3"
              >
                <p className="text-sm text-[var(--foreground)]">{item.note}</p>
                <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                  {formatUserDateTime(item.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={detailPanelClassName}>
        <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">
          Admin activity
        </h2>
        <p className="mb-4 text-xs text-[var(--muted-foreground)]">
          Actions performed by HQ admins on this account.
        </p>

        {activity.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No admin activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {activity.map((item) => (
              <li
                key={item.id}
                className="rounded-xl bg-[var(--surface-secondary)] px-3 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium capitalize text-[var(--foreground)]">
                    {item.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    {formatUserDateTime(item.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--foreground)]">
                  {item.description || formatSecurityAction(item.action)}
                </p>
                <span
                  className={cn(
                    'mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                    item.status === 'SUCCESS'
                      ? 'bg-[var(--success)]/15 text-[var(--success)]'
                      : 'bg-[var(--surface-tertiary)] text-[var(--muted-foreground)]',
                  )}
                >
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
