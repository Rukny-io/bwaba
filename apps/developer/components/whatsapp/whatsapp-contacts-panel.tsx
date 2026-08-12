'use client';

import { useState } from 'react';
import { Contact, Loader2, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardGrid } from '@/components/dashboard/dashboard-ui';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import {
  WhatsappEmptyState,
  whatsappBtnDanger,
  whatsappBtnPrimary,
  whatsappBtnSecondary,
  whatsappInputClass,
} from '@/components/whatsapp/whatsapp-ui';
import { useContactMutations, useContacts } from '@/hooks/use-contacts';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

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
  const total = pagination?.total ?? contacts.length;

  return (
    <div className="dashboard-section-stack">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={w.searchContacts}
          className={`${whatsappInputClass} min-w-[12rem] flex-1 rounded-xl`}
        />
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className={whatsappBtnPrimary}
        >
          <Plus className="size-3.5" />
          {w.addContact}
        </button>
      </div>

      <DashboardGrid>
        <DashboardMetricCard
          icon={Contact}
          label={w.metricContactsTotal}
          value={isLoading ? '…' : formatCount(total)}
          comparisonPrimary={w.metricContactsHint}
        />
      </DashboardGrid>

      {showForm ? (
        <section className="dashboard-panel space-y-3 rounded-2xl p-5 sm:rounded-3xl sm:p-6">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={w.contactName}
            className={whatsappInputClass}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={w.contactPhone}
            className={whatsappInputClass}
            dir="ltr"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={w.contactTags}
            className={whatsappInputClass}
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
            className={whatsappBtnPrimary}
          >
            {w.addContact}
          </button>
        </section>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : !contacts.length ? (
        <WhatsappEmptyState
          icon={Contact}
          title={w.noContacts}
          description={w.contactsEmptyDesc}
          action={
            <button type="button" onClick={() => setShowForm(true)} className={whatsappBtnPrimary}>
              <Plus className="size-3.5" />
              {w.addContact}
            </button>
          }
        />
      ) : (
        <>
          <div className="dashboard-panel divide-y divide-[var(--border)]/30 overflow-hidden rounded-2xl p-0 sm:rounded-3xl">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">{c.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-[var(--muted-foreground)]" dir="ltr">
                    {c.phoneNumber}
                  </p>
                  {c.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg bg-[var(--surface-secondary)] px-2 py-0.5 text-[11px] text-[var(--muted-foreground)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() =>
                    deleteMutation.mutate(c.id, {
                      onError: (e) => appToast.error(getApiErrorMessage(e)),
                    })
                  }
                  className={whatsappBtnDanger}
                  aria-label="Delete"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          {pagination && pagination.totalPages > 1 ? (
            <div className="flex justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className={whatsappBtnSecondary}
              >
                ←
              </button>
              <span className="inline-flex items-center px-2 text-[13px] tabular-nums text-[var(--muted-foreground)]">
                {page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className={whatsappBtnSecondary}
              >
                →
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
