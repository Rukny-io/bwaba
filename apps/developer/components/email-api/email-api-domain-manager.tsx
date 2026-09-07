'use client';

import { useState } from 'react';
import { Check, Copy, Loader2, RefreshCw } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentApp } from '@/components/providers/app-context';
import { appToast } from '@/lib/app-toast';
import {
  createEmailDomain,
  createEmailSender,
  listEmailDomains,
  listEmailSenders,
  refreshEmailDomain,
} from '@/lib/api/email-api';

const queryKey = (appId: string) => ['email-api', appId] as const;

export function EmailApiDomainManager() {
  const { app } = useCurrentApp();
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState('');
  const [sender, setSender] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const key = queryKey(app.appId);
  const domains = useQuery({ queryKey: [...key, 'domains'], queryFn: () => listEmailDomains(app.appId) });
  const senders = useQuery({ queryKey: [...key, 'senders'], queryFn: () => listEmailSenders(app.appId) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });
  const addDomain = useMutation({ mutationFn: () => createEmailDomain(app.appId, domain), onSuccess: () => { setDomain(''); void invalidate(); appToast.success('Domain verification started.'); }, onError: (error) => appToast.fromError(error, 'Could not add domain.') });
  const addSender = useMutation({ mutationFn: () => createEmailSender(app.appId, sender), onSuccess: () => { setSender(''); void invalidate(); appToast.success('Sender authorized for this app.'); }, onError: (error) => appToast.fromError(error, 'Could not authorize sender.') });
  const refresh = useMutation({ mutationFn: (value: string) => refreshEmailDomain(app.appId, value), onSuccess: () => { void invalidate(); appToast.success('Domain status refreshed.'); }, onError: (error) => appToast.fromError(error, 'Could not refresh domain.') });

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(null), 1500);
  }

  return <div className="space-y-4">
    <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
      <h2 className="text-base font-semibold">Verify a domain</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">The domain belongs to your account and can be linked to more than one app. Publish its DKIM records before adding a sender.</p>
      <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); if (domain.trim()) addDomain.mutate(); }}>
        <input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" inputMode="url" className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]" />
        <button disabled={addDomain.isPending} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] px-4 text-sm font-medium text-[var(--background)] disabled:opacity-60">{addDomain.isPending ? <Loader2 className="size-4 animate-spin" /> : null}Add domain</button>
      </form>
    </section>

    <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
      <h2 className="text-base font-semibold">DNS verification</h2>
      {domains.isLoading ? <p className="mt-3 text-sm text-[var(--muted-foreground)]">Loading domains…</p> : domains.data?.length ? <div className="mt-4 space-y-3">{domains.data.map((item) => <article key={item.domain} className="rounded-xl border border-[var(--border)]/60 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-mono text-sm font-medium">{item.domain}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">Status: <span className={item.status === 'verified' ? 'text-[var(--success)]' : ''}>{item.status}</span></p></div><button type="button" onClick={() => refresh.mutate(item.domain)} disabled={refresh.isPending} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--surface-secondary)] px-2.5 text-xs font-medium"><RefreshCw className="size-3.5" />Refresh</button></div>{item.status !== 'verified' ? <div className="mt-3 space-y-2"><p className="text-xs text-[var(--muted-foreground)]">Create these CNAME records:</p>{item.dkimTokens.length ? item.dkimTokens.map((token) => { const record = `${token}._domainkey.${item.domain} CNAME ${token}.dkim.amazonses.com`; return <button key={token} type="button" onClick={() => void copy(record)} className="flex w-full items-start gap-2 rounded-lg bg-[var(--surface-secondary)] p-2 text-left font-mono text-[11px] leading-relaxed"><span className="min-w-0 flex-1 break-all">{record}</span>{copied === record ? <Check className="mt-0.5 size-3.5 shrink-0" /> : <Copy className="mt-0.5 size-3.5 shrink-0" />}</button>; }) : <p className="text-xs text-[var(--muted-foreground)]">DKIM records are being prepared. Refresh shortly.</p>}</div> : null}</article>)}</div> : <p className="mt-3 text-sm text-[var(--muted-foreground)]">No domains yet.</p>}
    </section>

    <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
      <h2 className="text-base font-semibold">Authorized senders</h2>
      <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">A live API key for this app can only send from an address authorized here.</p>
      <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); if (sender.trim()) addSender.mutate(); }}>
        <input value={sender} onChange={(event) => setSender(event.target.value)} placeholder="noreply@example.com" type="email" className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]" />
        <button disabled={addSender.isPending} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] px-4 text-sm font-medium text-[var(--background)] disabled:opacity-60">{addSender.isPending ? <Loader2 className="size-4 animate-spin" /> : null}Authorize sender</button>
      </form>
      {senders.data?.length ? <ul className="mt-4 divide-y divide-[var(--border)]/50 rounded-xl border border-[var(--border)]/60">{senders.data.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2.5"><code className="min-w-0 truncate text-xs">{item.email}</code><span className="text-xs text-[var(--muted-foreground)]">{item.status}</span></li>)}</ul> : null}
    </section>
  </div>;
}
