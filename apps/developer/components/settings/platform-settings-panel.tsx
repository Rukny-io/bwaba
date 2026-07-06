'use client';



import Link from 'next/link';

import { Check, KeyRound, Package } from 'lucide-react';

import { useTranslations } from '@/components/providers/translations-provider';

import { useDeveloperUserPrefs } from '@/hooks/use-developer-user-prefs';

import { useSidebarProductsOptional } from '@/hooks/use-sidebar-products';

import { useDeveloperSubscription } from '@/hooks/use-api-keys';

import { DEVELOPER_PRODUCTS } from '@/lib/developer-products';

import {

  resolveEffectiveDeveloperPlan,

  formatQuotaRatio,

  isUnlimitedLimit,

} from '@/lib/developer-plan-limits';

import { appProducts } from '@/lib/app-routes';

import {

  OptionButton,

  SettingsSection,

} from '@/components/settings/settings-ui';



function InstalledProductsSettings({ appId }: { appId: string }) {

  const t = useTranslations();

  const s = t.developerSettings;

  const sidebar = useSidebarProductsOptional();

  const items = (t.products.items ?? {}) as Record<string, { name?: string }>;



  if (!sidebar) return null;



  const { isInstalled } = sidebar;



  return (

    <div className="space-y-3">

      <p className="text-xs text-[var(--muted-foreground)]">

        {s.productsAppHint.replace('{appId}', appId)}

      </p>



      <div className="space-y-2">

        {DEVELOPER_PRODUCTS.filter((p) => p.status === 'available').map((product) => {

          const installed = isInstalled(product.id);

          const name = items[product.id]?.name ?? product.id;

          return (

            <div

              key={product.id}

              className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-secondary)]/60 px-3 py-2.5"

            >

              <div className="flex min-w-0 items-center gap-2.5">

                <product.icon className="size-4 shrink-0 text-[var(--primary)]" />

                <span className="truncate text-sm font-medium">{name}</span>

              </div>

              {installed ? (

                <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--foreground)] ring-1 ring-[var(--border)]">

                  <Check className="size-3.5" />

                  {t.products.installed}

                </span>

              ) : (

                <Link

                  href={appProducts(appId)}

                  className="inline-flex h-8 shrink-0 items-center rounded-full bg-[var(--primary)] px-3 text-xs font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"

                >

                  {t.products.install}

                </Link>

              )}

            </div>

          );

        })}

      </div>



      <Link

        href={appProducts(appId)}

        className="inline-flex text-xs font-medium text-[var(--primary)] hover:underline"

      >

        {s.manageProducts}

      </Link>

    </div>

  );

}



export function PlatformSettingsPanel({

  lastAppId,

}: {

  lastAppId: string | null;

}) {

  const s = useTranslations().developerSettings;

  const { prefs, setDefaultEnvironment } = useDeveloperUserPrefs();

  const { data: subscription, isLoading: subLoading } = useDeveloperSubscription();



  const effectivePlan = subscription

    ? resolveEffectiveDeveloperPlan(subscription)

    : 'FREE';

  const planLabel =

    effectivePlan === 'PRO'

      ? subscription?.platformPlan

        ? s.planProVia.replace('{plan}', subscription.platformPlan)

        : s.planPro

      : s.planFree;



  return (

    <>

      <SettingsSection title={s.billingTitle} description={s.billingDesc}>

        <div className="rounded-xl bg-[var(--surface-secondary)]/60 p-4">

          <p className="text-xs font-medium text-[var(--muted-foreground)]">

            {s.currentPlan}

          </p>

          <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">

            {subLoading ? '…' : planLabel}

          </p>

          {subscription ? (

            <p className="mt-2 text-xs text-[var(--muted-foreground)]" dir="ltr">

              {formatQuotaRatio(

                subscription.apiKeysUsed,

                subscription.apiKeysLimit,

              )}{' '}

              API keys

              {subscription.appsLimit != null &&
              !isUnlimitedLimit(subscription.appsLimit)

                ? ` · ${subscription.appsUsed ?? 0}/${subscription.appsLimit ?? '—'} apps`

                : ''}

            </p>

          ) : null}

          <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">

            {s.usageBillingNote}

          </p>

          <Link

            href="/pricing"

            className="mt-4 inline-flex h-9 items-center justify-center rounded-full bg-[var(--primary)] px-4 text-xs font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"

          >

            {s.viewPricing}

          </Link>

        </div>

      </SettingsSection>



      <SettingsSection title={s.developerTitle} description={s.developerDesc}>

        <div className="space-y-6">

          <div>

            <p className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--foreground)]">

              <KeyRound className="size-3.5" />

              {s.defaultEnvLabel}

            </p>

            <p className="mb-3 text-xs text-[var(--muted-foreground)]">

              {s.defaultEnvDesc}

            </p>

            <div className="flex flex-wrap gap-2">

              <OptionButton

                active={prefs.defaultApiKeyEnvironment === 'test'}

                onClick={() => setDefaultEnvironment('test')}

              >

                {s.envTest}

              </OptionButton>

              <OptionButton

                active={prefs.defaultApiKeyEnvironment === 'live'}

                onClick={() => setDefaultEnvironment('live')}

              >

                {s.envLive}

              </OptionButton>

            </div>

          </div>



          <div>

            <p className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--foreground)]">

              <Package className="size-3.5" />

              {s.productsTitle}

            </p>

            <p className="mb-3 text-xs text-[var(--muted-foreground)]">

              {s.productsDesc}

            </p>

            {lastAppId ? (

              <InstalledProductsSettings appId={lastAppId} />

            ) : (

              <p className="rounded-xl bg-[var(--surface-secondary)]/60 px-3 py-3 text-xs text-[var(--muted-foreground)]">

                {s.productsNoApp}

              </p>

            )}

          </div>

        </div>

      </SettingsSection>

    </>

  );

}

