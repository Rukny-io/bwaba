'use client';

import { Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appToast } from '@/lib/app-toast';
import { getEmailSubscription, requestEmailStarter } from '@/lib/api/email-api';

export function EmailApiSubscriptionCard() {
  const queryClient = useQueryClient();
  const subscription = useQuery({ queryKey: ['email-api', 'subscription'], queryFn: getEmailSubscription });
  const request = useMutation({
    mutationFn: requestEmailStarter,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['email-api', 'subscription'] });
      appToast.success(`Subscription request #${result.ticketNumber} was sent.`);
    },
    onError: (error) => appToast.fromError(error, 'Could not request Email API Starter.'),
  });
  const data = subscription.data;
  return <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-base font-semibold">Email API Starter</h2><p className="mt-1 text-[13px] text-[var(--muted-foreground)]">15,000 IQD/month · 10,000 messages each month</p></div><button type="button" disabled={request.isPending} onClick={() => request.mutate()} className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-4 text-[13px] font-medium text-[var(--background)] disabled:opacity-60">{request.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}Request activation</button></div>
    {data ? <div className="mt-4 grid gap-3 text-[13px] sm:grid-cols-2"><div className="rounded-xl bg-[var(--surface-secondary)] p-3"><p className="text-[var(--muted-foreground)]">One-time free allowance</p><p className="mt-1 font-semibold">{data.trial.remaining.toLocaleString()} / {data.trial.quota.toLocaleString()} remaining</p></div><div className="rounded-xl bg-[var(--surface-secondary)] p-3"><p className="text-[var(--muted-foreground)]">Subscription</p><p className="mt-1 font-semibold capitalize">{data.subscription.status} · {data.subscription.remaining.toLocaleString()} messages remaining</p></div></div> : <p className="mt-4 text-sm text-[var(--muted-foreground)]">Loading allowance…</p>}
  </section>;
}
