'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleCheck, Clock, Loader2, Phone, RefreshCw, Send } from 'lucide-react';
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
      className="dashboard-panel group flex flex-col gap-4 rounded-2xl p-5 transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_60%,var(--surface))] sm:rounded-3xl sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]">
          <Phone className="size-5" strokeWidth={1.6} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="font-mono text-base font-semibold text-[var(--foreground)] sm:text-lg"
              dir="ltr"
            >
              {phone.displayPhoneNumber || phone.phoneNumber}
            </h3>
            <PhoneStatusBadge status={phone.status} />
          </div>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {phone.verifiedName || w.businessName}
          </p>
          <p className="mt-2 font-mono text-[11px] text-[var(--muted-foreground)]" dir="ltr">
            {w.phonePublicId}: {phone.phoneId}
          </p>
        </div>
      </div>
      <p className="text-[12.5px] font-medium text-[var(--primary)] group-hover:underline">
        {w.openPhoneWorkspace}
      </p>
    </Link>
  );
}

export function PhoneCard({
  phone,
  registerId,
  pin,
  setRegisterId,
  setPin,
  testId,
  testTo,
  setTestId,
  setTestTo,
  profileId,
  about,
  email,
  setProfileId,
  setAbout,
  setEmail,
  registerMutation,
  testMessageMutation,
  profileMutation,
}: {
  phone: WhatsappPhoneSummary;
  registerId: string | null;
  pin: string;
  setRegisterId: (id: string | null) => void;
  setPin: (pin: string) => void;
  testId: string | null;
  testTo: string;
  setTestId: (id: string | null) => void;
  setTestTo: (to: string) => void;
  profileId: string | null;
  about: string;
  email: string;
  setProfileId: (id: string | null) => void;
  setAbout: (about: string) => void;
  setEmail: (email: string) => void;
  registerMutation: ReturnType<typeof useWhatsappMutations>['registerMutation'];
  testMessageMutation: ReturnType<typeof useWhatsappMutations>['testMessageMutation'];
  profileMutation: ReturnType<typeof useWhatsappMutations>['profileMutation'];
}) {
  const w = useTranslations().whatsapp;
  const isPending = phone.status === 'PENDING';

  return (
    <article className="dashboard-panel overflow-hidden rounded-2xl sm:rounded-3xl">
      <header className="flex flex-col gap-4 border-b border-[var(--border)]/30 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]">
            <Phone className="size-5" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className="font-mono text-base font-semibold text-[var(--foreground)] sm:text-lg"
                dir="ltr"
              >
                {phone.displayPhoneNumber || phone.phoneNumber}
              </h3>
              <PhoneStatusBadge status={phone.status} />
            </div>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {phone.verifiedName || w.businessName}
            </p>
            <p className="mt-1 font-mono text-[11px] text-[var(--muted-foreground)]" dir="ltr">
              {w.phoneNumberId}: {phone.phoneNumberId}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        <dl className="grid gap-3 sm:grid-cols-3">
          <PhoneStatBox label={w.quality} value={phone.qualityRating || '—'} />
          <PhoneStatBox label={w.messagingLimit} value={phone.messagingLimit || '—'} />
          <PhoneStatBox
            label={w.businessName}
            value={phone.verifiedName || '—'}
          />
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
                  className={inputClass}
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
                className={whatsappBtnPrimary}
              >
                {w.registerPhone}
              </button>
            </div>
          </PhoneActionSection>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
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
                <Send className="size-4" />
                {w.sendTest}
              </button>
            </div>
          </PhoneActionSection>

          <PhoneActionSection title={w.editProfile} description={w.editProfileDesc}>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">
                  {w.profileAbout}
                </label>
                <input
                  type="text"
                  value={profileId === phone.id ? about : ''}
                  onChange={(e) => {
                    setProfileId(phone.id);
                    setAbout(e.target.value);
                  }}
                  placeholder={w.profileAbout}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">
                  {w.profileEmail}
                </label>
                <input
                  type="email"
                  value={profileId === phone.id ? email : ''}
                  onChange={(e) => {
                    setProfileId(phone.id);
                    setEmail(e.target.value);
                  }}
                  placeholder="hello@example.com"
                  className={inputClass}
                  dir="ltr"
                />
              </div>
              <button
                type="button"
                disabled={profileMutation.isPending}
                onClick={() =>
                  profileMutation.mutate(
                    { phoneId: phone.id, body: { about, email } },
                    {
                      onSuccess: () => appToast.success(w.profileSaved),
                      onError: (e) => appToast.error(getApiErrorMessage(e)),
                    },
                  )
                }
                className={whatsappBtnPrimary}
              >
                {w.editProfile}
              </button>
            </div>
          </PhoneActionSection>
        </div>
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
