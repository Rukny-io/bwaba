'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  Shield,
} from 'lucide-react';
import { ApiException } from '@/lib/api-client';
import { appToast } from '@/lib/app-toast';
import {
  getDeveloperLinkTargets,
  linkFormToDeveloperApp,
  type DeveloperLinkTarget,
  type DeveloperLinkTargetsResponse,
} from '@/lib/developer-embed-api';
import { getDeveloperAppFormsUrl } from '@/lib/developer-embed-urls';
import { formDetailCardSurfaceClass } from '@/lib/form-detail-styles';
import { cn } from '@/lib/utils';

function appIdSuffix(appId: string): string {
  return appId.slice(-4);
}

function SecurityBrief() {
  return (
    <section
      className={cn(
        formDetailCardSurfaceClass,
        'relative overflow-hidden border-[color-mix(in_srgb,var(--primary)_22%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_6%,var(--surface))]',
      )}
    >
      <div
        className="pointer-events-none absolute -start-8 -top-8 size-28 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] blur-2xl"
        aria-hidden
      />
      <div className="relative flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_14%,var(--background))]">
          <Shield className="size-5 text-[var(--primary)]" strokeWidth={1.6} />
        </div>
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            ربط آمن بتطبيقك
          </h3>
          <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
            يُسمح بتضمين النموذج عبر iframe على نطاق موقع التطبيق فقط — لا يمكن
            لأي موقع آخر عرضه. كل عملية ربط تتطلب رمز تأكيد لمرة واحدة صالح
            لـ ٥ دقائق.
          </p>
        </div>
      </div>
    </section>
  );
}

function AppTargetCard({
  target,
  selected,
  onSelect,
}: {
  target: DeveloperLinkTarget;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col gap-3 rounded-2xl border p-4 text-start transition-all sm:rounded-3xl',
        selected
          ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_8%,var(--surface))] shadow-sm shadow-[color-mix(in_srgb,var(--primary)_12%,transparent)]'
          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[color-mix(in_srgb,var(--foreground)_18%,var(--border))]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">
            {target.name}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-[var(--muted-foreground)]">
            {target.appId}
          </p>
        </div>
        {selected ? (
          <CheckCircle2 className="size-4 shrink-0 text-[var(--primary)]" />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            target.domainConfigured
              ? 'bg-[color-mix(in_srgb,var(--success)_12%,var(--background))] text-[var(--success)]'
              : 'bg-[color-mix(in_srgb,var(--warning)_12%,var(--background))] text-[var(--warning)]',
          )}
        >
          <Globe className="size-3" />
          {target.domainConfigured ? 'نطاق مضبوط' : 'يحتاج نطاقاً'}
        </span>
        <span className="text-[10px] text-[var(--muted-foreground)]">
          {target.linkedFormsCount} نموذج مربوط
        </span>
      </div>

      {target.websiteOrigin ? (
        <code
          dir="ltr"
          className="block truncate rounded-lg bg-[var(--surface-secondary)] px-2 py-1 font-mono text-[10px] text-[var(--foreground)]"
        >
          {target.websiteOrigin}
        </code>
      ) : null}
    </button>
  );
}

function ConfirmLinkStep({
  target,
  onBack,
  onLinked,
  formId,
}: {
  target: DeveloperLinkTarget;
  onBack: () => void;
  onLinked: () => void;
  formId: string;
}) {
  const [confirmDigits, setConfirmDigits] = useState('');
  const [linking, setLinking] = useState(false);
  const expected = appIdSuffix(target.appId);
  const digitsMatch = confirmDigits === expected;

  async function handleLink() {
    if (!digitsMatch) return;

    setLinking(true);
    try {
      await linkFormToDeveloperApp(formId, target.appId, target.linkChallenge);
      appToast.success('تم ربط النموذج بتطبيقك بنجاح');
      onLinked();
    } catch (e) {
      appToast.error(
        e instanceof ApiException ? e.message : 'تعذّر ربط النموذج',
      );
    } finally {
      setLinking(false);
    }
  }

  const appIdPrefix = target.appId.slice(0, -4);
  const appIdSuffixStr = target.appId.slice(-4);

  return (
    <section className={cn(formDetailCardSurfaceClass, 'relative overflow-hidden shadow-sm')}>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[color-mix(in_srgb,var(--primary)_4%,transparent)] to-transparent"
        aria-hidden
      />

      <div className="relative flex w-full flex-col items-center text-center">
        <div className="mb-3 flex size-12 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_10%,var(--background))] text-[var(--primary)] ring-1 ring-[color-mix(in_srgb,var(--primary)_20%,transparent)] sm:mb-4 sm:size-14 sm:rounded-2xl">
          <Lock className="size-5 sm:size-6" strokeWidth={1.5} />
        </div>

        <h3 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
          تأكيد الربط بتطبيق {target.name}
        </h3>
        <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-[var(--muted-foreground)] sm:mt-2 sm:text-sm">
          للتأكيد، يرجى كتابة آخر ٤ أرقام من معرّف التطبيق.
        </p>

        {!target.domainConfigured ? (
          <div className="mt-4 flex w-full gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--warning)_30%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_8%,var(--background))] px-3.5 py-3 text-start sm:gap-3 sm:px-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" />
            <p className="text-xs leading-relaxed text-[var(--foreground)]">
              لم يُضبط نطاق الموقع بعد. يمكنك الربط الآن، لكن التضمين لن يعمل حتى تضيف رابط موقعك في إعدادات Domains.
            </p>
          </div>
        ) : null}

        <div className="mt-5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 sm:mt-6 sm:rounded-2xl sm:p-5">
          <div
            className="mb-3 flex flex-wrap items-center justify-center gap-1.5 text-xs sm:mb-4 sm:text-sm"
            dir="ltr"
          >
            <span className="font-mono text-[var(--muted-foreground)]">
              {appIdPrefix}
            </span>
            <span className="rounded bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] px-1.5 py-0.5 font-mono text-sm font-bold tracking-wider text-[var(--primary)] sm:text-base">
              {appIdSuffixStr}
            </span>
          </div>

          <div className="flex justify-center">
            <input
              id="app-id-confirm"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              dir="ltr"
              value={confirmDigits}
              onChange={(e) =>
                setConfirmDigits(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              placeholder="••••"
              className="w-full max-w-[9rem] rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-center font-mono text-xl tracking-[0.2em] text-[var(--foreground)] outline-none transition-all placeholder:tracking-normal placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--primary)_15%,transparent)] sm:py-3 sm:text-2xl sm:tracking-[0.3em]"
            />
          </div>
        </div>

        <div className="mt-6 flex w-full flex-col-reverse justify-center gap-2.5 sm:flex-row sm:gap-3">
          <button
            type="button"
            disabled={linking}
            onClick={onBack}
            className="inline-flex h-10 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] sm:w-auto"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={!digitsMatch || linking}
            onClick={() => void handleLink()}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-8 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:w-auto"
          >
            {linking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Shield className="size-4" />
            )}
            تأكيد الربط
          </button>
        </div>
      </div>
    </section>
  );
}

function EmptyTargetsState() {
  const developersUrl =
    process.env.NEXT_PUBLIC_DEVELOPERS_URL?.replace(/\/$/, '') ||
    'https://developers.rukny.io';

  return (
    <section className={cn(formDetailCardSurfaceClass, 'space-y-4 border-dashed bg-[var(--surface-secondary)]/20 text-center')}>
      <p className="text-sm font-semibold text-[var(--foreground)]">
        لا يوجد تطبيق مطوّر جاهز للربط
      </p>
      <p className="mx-auto max-w-md text-xs leading-relaxed text-[var(--muted-foreground)]">
        أنشئ تطبيقاً في لوحة المطوّرين وثبّت منتج Forms عليه، ثم عد هنا لربط
        النموذج.
      </p>
      <a
        href={developersUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 text-xs font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
      >
        فتح لوحة المطوّرين
        <ExternalLink className="size-3.5" />
      </a>
    </section>
  );
}

export function DeveloperEmbedLinkPanel({
  formId,
  onLinked,
}: {
  formId: string;
  onLinked: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DeveloperLinkTargetsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DeveloperLinkTarget | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const result = await getDeveloperLinkTargets(formId);
      setData(result);
    } catch (e) {
      setError(
        e instanceof ApiException ? e.message : 'تعذّر تحميل التطبيقات',
      );
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-5 text-sm text-[var(--danger)]">
        {error}
        <button type="button" className="ms-2 underline" onClick={() => void load()}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!data?.canLink && data?.linkedApp) {
    return (
      <section className={cn(formDetailCardSurfaceClass, 'space-y-3')}>
        <p className="text-sm text-[var(--foreground)]">
          النموذج مربوط بالفعل بـ{' '}
          <span className="font-semibold">{data.linkedApp.name}</span>
        </p>
        <a
          href={getDeveloperAppFormsUrl(data.linkedApp.appId)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)]"
        >
          فتح في لوحة المطوّرين
          <ExternalLink className="size-3.5" />
        </a>
      </section>
    );
  }

  if (!data?.targets.length) {
    return (
      <div className="space-y-4">
        <SecurityBrief />
        <EmptyTargetsState />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SecurityBrief />

      {selected ? (
        <ConfirmLinkStep
          target={selected}
          formId={formId}
          onBack={() => setSelected(null)}
          onLinked={onLinked}
        />
      ) : (
        <>
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              اختر تطبيقك
            </h3>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              تظهر فقط التطبيقات التي تملكها وعليها منتج Forms مثبّت
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {data.targets.map((target) => (
              <li key={target.appId}>
                <AppTargetCard
                  target={target}
                  selected={false}
                  onSelect={() => setSelected(target)}
                />
              </li>
            ))}
          </ul>

          <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">
            يمكنك ضبط نطاق الموقع لكل تطبيق من إعدادات Domains في لوحة
            المطوّرين بعد الربط.
          </p>
        </>
      )}
    </div>
  );
}
