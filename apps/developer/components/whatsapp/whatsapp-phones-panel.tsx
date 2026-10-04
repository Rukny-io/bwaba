'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleCheck, Clock, Loader2, Phone, RefreshCw, Send, UserRound } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardGrid } from '@/components/dashboard/dashboard-ui';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import {
  PhoneActionSection,
  PhoneStatBox,
  PhoneStatusBadge,
  WhatsappEmptyState,
  whatsappBtnPrimary,
  whatsappBtnSecondary,
  whatsappInputClass,
} from '@/components/whatsapp/whatsapp-ui';
import { EmbeddedSignupButton } from '@/components/whatsapp/embedded-signup-button';
import { usePhoneNumbers, useWhatsappAccounts, useWhatsappMutations } from '@/hooks/use-whatsapp';
import type { WhatsappPhoneSummary } from '@/lib/api/types';
import { appWhatsappPhoneHref } from '@/lib/whatsapp-phone-routes';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

const inputClass = whatsappInputClass;

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function PhonePickerCard({ appId, phone }: { appId: string; phone: WhatsappPhoneSummary }) {
  const w = useTranslations().whatsapp;

  return (
    <Link
      href={appWhatsappPhoneHref(appId, phone.phoneId)}
      className="dashboard-panel group flex flex-col gap-3.5 p-4 transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_55%,var(--surface))] sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)]">
          <Phone className="size-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="font-mono text-[15px] font-semibold text-[var(--foreground)]"
              dir="ltr"
            >
              {phone.displayPhoneNumber || phone.phoneNumber}
            </h3>
            <PhoneStatusBadge status={phone.status} />
          </div>
          <p className="mt-1 truncate text-[13px] text-[var(--muted-foreground)]">
            {phone.verifiedName || w.businessName}
          </p>
          <p className="mt-1.5 font-mono text-[11px] text-[var(--muted-foreground)]" dir="ltr">
            {w.phonePublicId}: {phone.phoneId}
          </p>
        </div>
      </div>
      <p className="text-[12.5px] font-medium text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--foreground)]">
        {w.openPhoneWorkspace}
      </p>
    </Link>
  );
}

export function PhoneCard({
  appId,
  phone,
  registerId,
  pin,
  setRegisterId,
  setPin,
  testId,
  testTo,
  setTestId,
  setTestTo,
  registerMutation,
  testMessageMutation,
}: {
  appId: string;
  phone: WhatsappPhoneSummary;
  registerId: string | null;
  pin: string;
  setRegisterId: (id: string | null) => void;
  setPin: (pin: string) => void;
  testId: string | null;
  testTo: string;
  setTestId: (id: string | null) => void;
  setTestTo: (to: string) => void;
  registerMutation: ReturnType<typeof useWhatsappMutations>['registerMutation'];
  testMessageMutation: ReturnType<typeof useWhatsappMutations>['testMessageMutation'];
}) {
  const w = useTranslations().whatsapp;
  const isPending = phone.status === 'PENDING';

  return (
    <article className="dashboard-panel space-y-4 p-4 sm:space-y-5 sm:p-5">
      <dl className="grid gap-2.5 sm:grid-cols-3">
        <PhoneStatBox label={w.quality} value={phone.qualityRating || '—'} />
        <PhoneStatBox label={w.messagingLimit} value={phone.messagingLimit || '—'} />
        <PhoneStatBox label={w.phoneNumberId} value={phone.phoneNumberId} dir="ltr" />
      </dl>

      {isPending ? (
        <PhoneActionSection
          title={w.registerPhone}
          description={w.registerPhoneDesc}
          variant="highlight"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">
                {w.registerPin}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={registerId === phone.id ? pin : ''}
                onChange={(e) => {
                  setRegisterId(phone.id);
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                }}
                placeholder="000000"
                className={cn(inputClass, 'font-mono tracking-[0.2em]')}
                dir="ltr"
              />
            </div>
            <button
              type="button"
              disabled={registerMutation.isPending || pin.length !== 6}
              onClick={() =>
                registerMutation.mutate(
                  { phoneId: phone.id, pin },
                  {
                    onSuccess: () => appToast.success(w.registerPhone),
                    onError: (e) => appToast.error(getApiErrorMessage(e)),
                  },
                )
              }
              className={cn(whatsappBtnPrimary, 'sm:min-w-[8.5rem]')}
            >
              {registerMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              {w.registerPhone}
            </button>
          </div>
        </PhoneActionSection>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <PhoneActionSection title={w.sendTest} description={w.sendTestDesc}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">
                {w.testRecipient}
              </label>
              <input
                type="tel"
                value={testId === phone.id ? testTo : ''}
                onChange={(e) => {
                  setTestId(phone.id);
                  setTestTo(e.target.value);
                }}
                placeholder="+9647XXXXXXXX"
                className={inputClass}
                dir="ltr"
              />
            </div>
            <button
              type="button"
              disabled={testMessageMutation.isPending || !testTo.trim()}
              onClick={() =>
                testMessageMutation.mutate(
                  { phoneId: phone.id, to: testTo.trim() },
                  {
                    onSuccess: () => appToast.success(w.testSent),
                    onError: (e) => appToast.error(getApiErrorMessage(e)),
                  },
                )
              }
              className={whatsappBtnSecondary}
            >
              {testMessageMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              {w.sendTest}
            </button>
          </div>
        </PhoneActionSection>

        <PhoneActionSection title={w.profileManageCta} description={w.profileManageDesc}>
          <Link
            href={appWhatsappPhoneHref(appId, phone.phoneId, 'profile')}
            className={cn(whatsappBtnSecondary, 'w-full justify-center sm:w-auto')}
          >
            <UserRound className="size-3.5" />
            {w.profileManageCta}
          </Link>
        </PhoneActionSection>
      </div>
    </article>
  );
}

export function WhatsappPhonesPanel({ appId }: { appId: string }) {
  const w = useTranslations().whatsapp;
  const { data: phones, isLoading } = usePhoneNumbers(appId);
  const { data: accounts, isLoading: accountsLoading } = useWhatsappAccounts(appId);
  const { refreshMutation } = useWhatsappMutations(appId);

  const activeAccount =
    accounts?.find((a) => a.status === 'ACTIVE') ?? accounts?.[0] ?? null;
  const linkedWabaId = activeAccount?.wabaId;

  if (isLoading || accountsLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (!phones?.length) {
    const emptyAction =
      linkedWabaId ? (
        <EmbeddedSignupButton
          appId={appId}
          mode="add-phone"
          wabaId={linkedWabaId}
          className={whatsappBtnPrimary}
        />
      ) : (
        <EmbeddedSignupButton appId={appId} />
      );

    return (
      <WhatsappEmptyState
        icon={Phone}
        title={w.noPhones}
        description={w.noPhonesDesc}
        action={emptyAction}
      />
    );
  }

  const activeCount = phones.filter(
    (p) => p.status === 'ACTIVE' || p.status === 'CONNECTED',
  ).length;
  const pendingCount = phones.filter((p) => p.status === 'PENDING').length;

  return (
    <div className="dashboard-section-stack">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
            {w.phonePickerTitle}
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
            {w.phonePickerDesc}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          {linkedWabaId ? (
            <EmbeddedSignupButton
              appId={appId}
              mode="add-phone"
              wabaId={linkedWabaId}
              className={whatsappBtnPrimary}
            />
          ) : null}
          {activeAccount ? (
            <button
              type="button"
              disabled={refreshMutation.isPending}
              onClick={() =>
                refreshMutation.mutate(activeAccount.id, {
                  onSuccess: () => appToast.success(w.refresh),
                  onError: (e) => appToast.error(getApiErrorMessage(e)),
                })
              }
              className={whatsappBtnSecondary}
            >
              <RefreshCw
                className={cn('size-3.5', refreshMutation.isPending && 'animate-spin')}
              />
              {w.refresh}
            </button>
          ) : null}
        </div>
      </section>

      <DashboardGrid>
        <DashboardMetricCard
          icon={Phone}
          label={w.phonesCount}
          value={formatCount(phones.length)}
          comparisonPrimary={w.metricPhonesHint}
        />
        <DashboardMetricCard
          icon={CircleCheck}
          label={w.metricActivePhones}
          value={formatCount(activeCount)}
          comparisonPrimary={w.metricActivePhonesHint}
        />
        <DashboardMetricCard
          icon={Clock}
          label={w.metricPendingPhones}
          value={formatCount(pendingCount)}
          comparisonPrimary={w.metricPendingPhonesHint}
        />
      </DashboardGrid>

      <div className="grid gap-4 sm:grid-cols-2">
        {phones.map((phone) => (
          <PhonePickerCard key={phone.id} appId={appId} phone={phone} />
        ))}
      </div>
    </div>
  );
}
