'use client';

import { useState } from 'react';
import { CircleCheck, Clock, Loader2, Phone, Send } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardGrid } from '@/components/dashboard/dashboard-ui';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import {
  PhoneActionSection,
  PhoneStatBox,
  PhoneStatusBadge,
} from '@/components/whatsapp/whatsapp-ui';
import { usePhoneNumbers, useWhatsappMutations } from '@/hooks/use-whatsapp';
import type { WhatsappPhoneSummary } from '@/lib/api/types';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--primary)]';

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function PhoneCard({
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
    <article className="dashboard-card overflow-hidden rounded-2xl sm:rounded-3xl">
      <header className="flex flex-col gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
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
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50"
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
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--surface-secondary)] px-5 text-sm font-medium transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_6%,var(--surface-secondary))]"
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
                className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50"
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
  const { registerMutation, profileMutation, testMessageMutation } =
    useWhatsappMutations(appId);

  const [registerId, setRegisterId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [testId, setTestId] = useState<string | null>(null);
  const [testTo, setTestTo] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [about, setAbout] = useState('');
  const [email, setEmail] = useState('');

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (!phones?.length) {
    return (
      <section className="dashboard-card rounded-2xl p-8 text-center sm:rounded-3xl sm:p-10">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
          <Phone className="size-6" strokeWidth={1.6} />
        </div>
        <h2 className="mt-4 text-base font-semibold text-[var(--foreground)]">{w.noPhones}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)]">
          {w.noPhonesDesc}
        </p>
      </section>
    );
  }

  const activeCount = phones.filter(
    (p) => p.status === 'ACTIVE' || p.status === 'CONNECTED',
  ).length;
  const pendingCount = phones.filter((p) => p.status === 'PENDING').length;

  return (
    <div className="space-y-6 sm:space-y-8">
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

      <div className="space-y-4 sm:space-y-5">
        {phones.map((phone) => (
          <PhoneCard
            key={phone.id}
            phone={phone}
            registerId={registerId}
            pin={pin}
            setRegisterId={setRegisterId}
            setPin={setPin}
            testId={testId}
            testTo={testTo}
            setTestId={setTestId}
            setTestTo={setTestTo}
            profileId={profileId}
            about={about}
            email={email}
            setProfileId={setProfileId}
            setAbout={setAbout}
            setEmail={setEmail}
            registerMutation={registerMutation}
            testMessageMutation={testMessageMutation}
            profileMutation={profileMutation}
          />
        ))}
      </div>
    </div>
  );
}
