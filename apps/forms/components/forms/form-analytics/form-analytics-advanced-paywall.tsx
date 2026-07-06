'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { planDisplayName } from '@/lib/api/subscriptions';
import { WHALE_PLAN_LABEL } from '@/lib/form-field-plan';
import { ACCOUNTS_URL } from '@/lib/config';

const BILLING_URL = `${ACCOUNTS_URL.replace(/\/$/, '')}/manage/billing`;

export function FormAnalyticsAdvancedPaywall({ plan }: { plan: string }) {
  return (
    <div className="flex max-w-md flex-col items-center px-4 text-center">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        <h3 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
          هل أنت مستعد لتحسين نموذجك؟
        </h3>
        <span className="inline-flex items-center rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-bold text-[var(--primary)]">
          {WHALE_PLAN_LABEL}
        </span>
      </div>

      <p className="mb-6 text-sm leading-relaxed text-[var(--muted-foreground)]">
        تتبّع الانسحاب سؤالاً بسؤال، حلّل توزيع الإجابات، وراقب مؤشر NPS — متاح
        في باقة {WHALE_PLAN_LABEL} وما فوق.
      </p>

      <Link
        href={BILLING_URL}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/20 transition hover:opacity-90"
      >
        <Sparkles className="size-4" />
        ترقية الخطة
      </Link>

      <p className="mt-4 text-xs text-[var(--muted-foreground)]">
        خطتك الحالية: {planDisplayName(plan)}
      </p>
    </div>
  );
}
