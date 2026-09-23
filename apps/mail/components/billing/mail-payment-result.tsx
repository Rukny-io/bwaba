'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@heroui/react';
import { fetchMailPaymentStatus } from '@/lib/mail-subscription-client';
import { isValidMailAppId, readMailAppIdFromDocument } from '@/lib/mail-app-id';

function resolveAppId(fromQuery: string | null) {
  if (fromQuery && isValidMailAppId(fromQuery)) return fromQuery;
  return readMailAppIdFromDocument();
}

function SuccessBody() {
  const params = useSearchParams();
  const paymentId = params.get('payment');
  const appId = resolveAppId(params.get('app'));

  return (
    <ResultShell
      icon={<CheckCircle2 className="size-8 text-emerald-600" />}
      title="Payment successful"
      description="Your Mail plan is now active for this workspace."
    >
      {paymentId ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Payment ref: <span className="font-medium tabular-nums">{paymentId.slice(0, 8)}…</span>
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          onPress={() => {
            window.location.href = '/billing';
          }}
        >
          Back to billing
        </Button>
        {appId ? (
          <Button
            variant="secondary"
            onPress={() => {
              window.location.href = '/';
            }}
          >
            Open workspace
          </Button>
        ) : null}
      </div>
    </ResultShell>
  );
}

function FailedBody() {
  const params = useSearchParams();
  const status = params.get('status');

  return (
    <ResultShell
      icon={<XCircle className="size-8 text-[var(--danger)]" />}
      title="Payment not completed"
      description="You can try again from Billing, or request admin activation."
    >
      {status ? (
        <p className="text-sm text-[var(--muted-foreground)]">Status: {status}</p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          onPress={() => {
            window.location.href = '/billing';
          }}
        >
          Try again
        </Button>
        <Link
          href="/pricing"
          className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 text-sm font-medium"
        >
          Compare plans
        </Link>
      </div>
    </ResultShell>
  );
}

function PendingBody() {
  const router = useRouter();
  const params = useSearchParams();
  const paymentId = params.get('payment');
  const appId = resolveAppId(params.get('app'));
  const [message, setMessage] = useState('Confirming payment…');

  useEffect(() => {
    if (!paymentId || !isValidMailAppId(appId)) {
      setMessage('Waiting for payment confirmation.');
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const tick = async () => {
      attempts += 1;
      try {
        const status = await fetchMailPaymentStatus(paymentId, appId);
        if (cancelled) return;
        if (status.status === 'COMPLETED') {
          router.replace(
            `/billing/payment/success?payment=${encodeURIComponent(paymentId)}&app=${encodeURIComponent(appId)}&paid=1`,
          );
          return;
        }
        if (status.status === 'FAILED') {
          router.replace(
            `/billing/payment/failed?payment=${encodeURIComponent(paymentId)}&app=${encodeURIComponent(appId)}&status=FAILED`,
          );
          return;
        }
      } catch {
        // keep polling
      }

      if (attempts >= 10) {
        setMessage('Still waiting for confirmation. You can refresh in a moment.');
        return;
      }
      window.setTimeout(() => {
        void tick();
      }, 2500);
    };

    void tick();
    return () => {
      cancelled = true;
    };
  }, [appId, paymentId, router]);

  return (
    <ResultShell
      icon={<Loader2 className="size-8 animate-spin text-[var(--primary)]" />}
      title="Confirming payment"
      description={message}
    />
  );
}

function ResultShell({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-[var(--surface-secondary)]">
        {icon}
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

function Fallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--muted-foreground)]">
      Loading…
    </div>
  );
}

export function MailPaymentSuccessPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <SuccessBody />
    </Suspense>
  );
}

export function MailPaymentFailedPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <FailedBody />
    </Suspense>
  );
}

export function MailPaymentPendingPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <PendingBody />
    </Suspense>
  );
}
