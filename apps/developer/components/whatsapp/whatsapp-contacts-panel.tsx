'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { useContactMutations, useContacts } from '@/hooks/use-contacts';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

const cardClass =
  'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:rounded-3xl';

export function WhatsappContactsPanel() {
  const w = useTranslations().whatsapp;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useContacts(search || undefined, page);
  const { createMutation, deleteMutation } = useContactMutations();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tags, setTags] = useState('');
  const [showForm, setShowForm] = useState(false);

  const contacts = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={w.searchContacts}
          className="min-w-[12rem] flex-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        />
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-foreground)]"
        >
          <Plus className="size-3.5" />
          {w.addContact}
        </button>
      </div>

      {showForm && (
        <section className={cn(cardClass, 'space-y-3')}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={w.contactName}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={w.contactPhone}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
            dir="ltr"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={w.contactTags}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
          />
          <button
            type="button"
            disabled={!name.trim() || !phone.trim() || createMutation.isPending}
            onClick={() =>
              createMutation.mutate(
                {
                  name: name.trim(),
                  phoneNumber: phone.trim(),
                  tags: tags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                },
                {
                  onSuccess: () => {
                    setName('');
                    setPhone('');
                    setTags('');
                    setShowForm(false);
                    appToast.success(w.addContact);
                  },
                  onError: (e) => appToast.error(getApiErrorMessage(e)),
                },
              )
            }
            className="rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-foreground)] disabled:opacity-50"
          >
            {w.addContact}
          </button>
        </section>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : !contacts.length ? (
        <section className={cn(cardClass, 'text-center text-sm text-[var(--muted-foreground)]')}>
          {w.noContacts}
        </section>
      ) : (
        <>
          <div className={cn(cardClass, 'divide-y divide-[var(--border)] p-0')}>
            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="font-mono text-xs text-[var(--muted-foreground)]" dir="ltr">
                    {c.phoneNumber}
                  </p>
                  {c.tags.length > 0 && (
                    <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                      {c.tags.join(', ')}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() =>
                    deleteMutation.mutate(c.id, {
                      onError: (e) => appToast.error(getApiErrorMessage(e)),
                    })
                  }
                  className="rounded-full p-2 text-[var(--danger)] hover:bg-[var(--surface-secondary)]"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-[var(--border)] px-4 py-1.5 text-xs"
              >
                {w.loadMore}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
