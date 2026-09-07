'use client';

import { useMemo, useState } from 'react';
import { Loader2, Play, Shield } from 'lucide-react';
import Link from 'next/link';
import { useCurrentApp } from '@/components/providers/app-context';
import { useApiKeys } from '@/hooks/use-api-keys';
import { appApiKeysNew } from '@/lib/app-routes';
import { executeEmailApiTry } from '@/lib/api/email-api';

export function EmailApiTryIt() {
  const { app } = useCurrentApp();
  const { data: apiKeys, isLoading: keysLoading } = useApiKeys(app.id);
  const keys = useMemo(() => (apiKeys ?? []).filter((key) => key.environment === 'test' && key.status === 'ACTIVE' && key.scopes.includes('email:send')), [apiKeys]);
  const [apiKeySlug, setApiKeySlug] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('Email API test');
  const [bodyText, setBodyText] = useState('Hello from Rukny Email API.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  async function send() {
    if (!apiKeySlug || !from || !to || !subject || !bodyText) { setError('Complete all fields and select a test key.'); return; }
    setLoading(true); setError(''); setResult('');
    try {
      const response = await executeEmailApiTry({ appId: app.appId, apiKeySlug, from, to, subject, bodyText });
      setResult(`HTTP ${response.status}\n${JSON.stringify(response.body, null, 2)}`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Request failed.'); }
    finally { setLoading(false); }
  }

  return <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
    <div className="flex items-start gap-3"><Shield className="mt-0.5 size-5 text-[var(--primary)]" /><div><h2 className="text-base font-semibold">Try it safely</h2><p className="mt-1 text-[13px] leading-relaxed text-[var(--muted-foreground)]">This console only accepts a test key. The key stays on the server and test sends are limited to your account email.</p></div></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-medium text-[var(--muted-foreground)]">Test API key</span><select value={apiKeySlug} onChange={(event) => setApiKeySlug(event.target.value)} className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm"><option value="">{keysLoading ? 'Loading keys…' : 'Select test key'}</option>{keys.map((key) => <option key={key.slug} value={key.slug}>{key.name} · …{key.keySuffix}</option>)}</select></label><label className="space-y-1.5"><span className="text-xs font-medium text-[var(--muted-foreground)]">From (authorized sender)</span><input value={from} onChange={(event) => setFrom(event.target.value)} placeholder="noreply@example.com" className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" /></label><label className="space-y-1.5"><span className="text-xs font-medium text-[var(--muted-foreground)]">To (your account email)</span><input value={to} onChange={(event) => setTo(event.target.value)} placeholder="you@example.com" className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" /></label><label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-medium text-[var(--muted-foreground)]">Subject</span><input value={subject} onChange={(event) => setSubject(event.target.value)} className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" /></label><label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-medium text-[var(--muted-foreground)]">Text body</span><textarea value={bodyText} onChange={(event) => setBodyText(event.target.value)} rows={4} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm" /></label></div>
    {!keys.length && !keysLoading ? <p className="mt-3 text-xs text-[var(--muted-foreground)]">Create a <Link href={appApiKeysNew(app.appId)} className="underline underline-offset-2">test key</Link> with <code>email:send</code> first.</p> : null}
    <button type="button" disabled={loading} onClick={() => void send()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--foreground)] px-4 text-sm font-medium text-[var(--background)] disabled:opacity-60">{loading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}Send test</button>
    {error ? <p className="mt-3 text-sm text-[var(--destructive)]">{error}</p> : null}{result ? <pre className="mt-4 overflow-x-auto rounded-xl bg-[var(--surface-secondary)] p-3 text-xs leading-relaxed">{result}</pre> : null}
  </section>;
}
