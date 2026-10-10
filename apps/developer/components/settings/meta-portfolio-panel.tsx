'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Description,
  Input,
  Label,
  TextArea,
  TextField,
} from '@heroui/react';
import { useTranslations } from '@/components/providers/translations-provider';
import { SettingsSection } from '@/components/settings/settings-ui';
import {
  settingsInputClassName,
  settingsLabelClassName,
  settingsTextareaClassName,
} from '@/components/settings/app-settings-section';
import { Checkbox } from '@/components/ui/checkbox';
import { FormDropdown } from '@/components/ui/form-dropdown';
import {
  getMetaPortfolioStatus,
  submitMetaPortfolioRequest,
} from '@/lib/api/meta-portfolio';
import { listApps } from '@/lib/api/apps';
import { redirectToDeveloperCheckout } from '@/lib/developer-checkout';
import { appToast } from '@/lib/app-toast';
import { appWhatsapp } from '@/lib/app-routes';
import { cn } from '@/lib/utils';

const requirementClassName =
  'text-[12px] leading-relaxed text-[var(--muted-foreground)]';

export function MetaPortfolioPanel() {
  const t = useTranslations();
  const s = t.metaPortfolio;
  const locale = t.common.locale === 'ar' ? 'ar' : 'en';
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['meta-portfolio-status'],
    queryFn: getMetaPortfolioStatus,
    retry: 1,
  });

  const { data: appsFallback = [] } = useQuery({
    queryKey: ['developer-apps'],
    queryFn: listApps,
  });

  const [businessName, setBusinessName] = useState('');
  const [domain, setDomain] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [appId, setAppId] = useState('');
  const [ackOwnership, setAckOwnership] = useState(false);
  const [ackSla, setAckSla] = useState(false);
  const [upgradeBusy, setUpgradeBusy] = useState(false);

  const isPro = Boolean(data?.isPro);
  const latest = data?.latestRequest ?? null;

  const fieldMap = useMemo(() => {
    const map = new Map<string, { label: string; requirement: string }>();
    for (const field of data?.fields ?? []) {
      map.set(field.key, {
        label: locale === 'ar' ? field.labelAr : field.label,
        requirement: locale === 'ar' ? field.requirementAr : field.requirement,
      });
    }
    return map;
  }, [data?.fields, locale]);

  const selectableApps = useMemo(() => {
    const fromStatus = (data?.apps ?? []).filter((a) => a.canRequest);
    if (fromStatus.length > 0) {
      return fromStatus.map((a) => ({ appId: a.appId, name: a.name }));
    }

    if ((data?.apps ?? []).length > 0) {
      return (data?.apps ?? []).map((a) => ({
        appId: a.appId,
        name: a.name,
      }));
    }

    return appsFallback
      .filter((a) => a.status !== 'DELETED')
      .map((a) => ({ appId: a.appId, name: a.name }));
  }, [data?.apps, appsFallback]);

  const appOptions = useMemo(
    () =>
      selectableApps.map((app) => ({
        id: app.appId,
        label: `${app.name} (${app.appId})`,
      })),
    [selectableApps],
  );

  const submitMutation = useMutation({
    mutationFn: submitMetaPortfolioRequest,
    onSuccess: async (result) => {
      appToast.success(result.message || s.submitSuccess);
      setBusinessName('');
      setDomain('');
      setBusinessEmail('');
      setWebsiteUrl('');
      setBusinessDescription('');
      setAppId('');
      setAckOwnership(false);
      setAckSla(false);
      await queryClient.invalidateQueries({ queryKey: ['meta-portfolio-status'] });
    },
    onError: (err) => {
      appToast.fromError(err, s.submitError);
    },
  });

  async function handleUpgrade() {
    if (upgradeBusy) return;
    setUpgradeBusy(true);
    try {
      await redirectToDeveloperCheckout({
        kind: 'PRO_UPGRADE',
        billingCycle: 'MONTHLY',
      });
    } catch (err) {
      appToast.fromError(err, s.upgradeError);
      setUpgradeBusy(false);
    }
  }

  const formFilled =
    ackOwnership &&
    ackSla &&
    businessName.trim().length >= 2 &&
    domain.trim().length >= 3 &&
    businessEmail.trim().includes('@') &&
    websiteUrl.startsWith('https://') &&
    businessDescription.trim().length >= 20 &&
    Boolean(appId);

  const canSubmit =
    isPro && formFilled && selectableApps.length > 0 && !submitMutation.isPending;

  const submitLabel = !isPro
    ? s.submitLocked
    : submitMutation.isPending
      ? '…'
      : s.submit;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SettingsSection title={s.title} description={s.subtitle}>
        <div className="space-y-3 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          <p>
            {locale === 'ar'
              ? data?.reviewSlaNoteAr
              : data?.reviewSlaNote || s.slaNote}
          </p>
          <p>{s.ownershipNote}</p>
        </div>

        {isLoading ? (
          <p className="mt-4 text-[13px] text-[var(--muted-foreground)]">…</p>
        ) : null}

        {isError ? (
          <p className="mt-4 text-[13px] text-[var(--muted-foreground)]">
            {s.loadError}
          </p>
        ) : null}

        {!isPro && !isLoading ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--surface-secondary)]/55 px-4 py-3.5">
            <p className="min-w-0 flex-1 text-[13px] text-[var(--foreground)]">
              {s.proRequired}
            </p>
            <Link
              href="/pricing"
              className="shrink-0 text-[13px] font-medium text-[var(--primary)] hover:underline"
            >
              {s.viewPricing}
            </Link>
          </div>
        ) : null}

        {latest ? (
          <div className="mt-5 space-y-1.5 rounded-xl bg-[var(--surface-secondary)]/55 px-4 py-3.5">
            <p className="text-[12px] font-medium text-[var(--muted-foreground)]">
              {s.latestRequest}
            </p>
            <p className="text-[14px] font-semibold text-[var(--foreground)]">
              {latest.businessName} · {latest.status}
            </p>
            <p className="text-[12px] text-[var(--muted-foreground)]" dir="ltr">
              {latest.domain} · {latest.businessEmail}
            </p>
            {latest.rejectionReason ? (
              <p className="pt-1 text-[12px] text-[var(--destructive)]">
                {s.rejectionReason}: {latest.rejectionReason}
              </p>
            ) : null}
            {latest.status === 'fulfilled' && latest.appId ? (
              <div className="pt-2">
                <Link
                  href={appWhatsapp(latest.appId)}
                  className="inline-flex h-9 items-center rounded-full bg-[var(--foreground)] px-4 text-[13px] font-semibold text-[var(--background)]"
                >
                  {s.connectWhatsapp}
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </SettingsSection>

      <SettingsSection title={s.formTitle} description={s.formDesc}>
        <form
          id="meta-portfolio-request-form"
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) {
              if (!isPro) {
                appToast.error(s.proRequired);
              }
              return;
            }
            submitMutation.mutate({
              appId,
              businessName: businessName.trim(),
              domain: domain.trim(),
              businessEmail: businessEmail.trim(),
              websiteUrl: websiteUrl.trim(),
              businessDescription: businessDescription.trim(),
            });
          }}
        >
          <div className="space-y-1.5">
            <FormDropdown
              label={fieldMap.get('appId')?.label ?? s.appId}
              labelClassName={settingsLabelClassName}
              value={appId}
              options={appOptions}
              placeholder={s.selectApp}
              onChange={setAppId}
              dir="ltr"
            />
            <p className={requirementClassName}>
              {fieldMap.get('appId')?.requirement ?? s.appIdHint}
            </p>
            {selectableApps.length === 0 ? (
              <p className="text-[13px] text-[var(--muted-foreground)]">
                {s.noApps}
              </p>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              isRequired
              value={businessName}
              onChange={setBusinessName}
              minLength={2}
            >
              <Label className={settingsLabelClassName}>
                {fieldMap.get('businessName')?.label ?? s.businessName}
              </Label>
              <Input className={settingsInputClassName} />
              <Description className={requirementClassName}>
                {fieldMap.get('businessName')?.requirement ?? s.businessNameHint}
              </Description>
            </TextField>

            <TextField
              isRequired
              value={domain}
              onChange={setDomain}
              minLength={3}
            >
              <Label className={settingsLabelClassName}>
                {fieldMap.get('domain')?.label ?? s.domain}
              </Label>
              <Input
                className={cn(settingsInputClassName, 'dir-ltr')}
                dir="ltr"
                placeholder="example.com"
              />
              <Description className={requirementClassName}>
                {fieldMap.get('domain')?.requirement ?? s.domainHint}
              </Description>
            </TextField>

            <TextField
              isRequired
              value={businessEmail}
              onChange={setBusinessEmail}
            >
              <Label className={settingsLabelClassName}>
                {fieldMap.get('businessEmail')?.label ?? s.businessEmail}
              </Label>
              <Input
                type="email"
                className={cn(settingsInputClassName, 'dir-ltr')}
                dir="ltr"
                placeholder="info@example.com"
              />
              <Description className={requirementClassName}>
                {fieldMap.get('businessEmail')?.requirement ??
                  s.businessEmailHint}
              </Description>
            </TextField>

            <TextField isRequired value={websiteUrl} onChange={setWebsiteUrl}>
              <Label className={settingsLabelClassName}>
                {fieldMap.get('websiteUrl')?.label ?? s.websiteUrl}
              </Label>
              <Input
                type="url"
                className={cn(settingsInputClassName, 'dir-ltr')}
                dir="ltr"
                placeholder="https://example.com"
              />
              <Description className={requirementClassName}>
                {fieldMap.get('websiteUrl')?.requirement ?? s.websiteUrlHint}
              </Description>
            </TextField>
          </div>

          <TextField
            isRequired
            value={businessDescription}
            onChange={setBusinessDescription}
            minLength={20}
          >
            <Label className={settingsLabelClassName}>
              {fieldMap.get('businessDescription')?.label ??
                s.businessDescription}
            </Label>
            <TextArea
              className={cn(settingsTextareaClassName, 'min-h-28 resize-y')}
              rows={4}
            />
            <Description className={requirementClassName}>
              {fieldMap.get('businessDescription')?.requirement ??
                s.businessDescriptionHint}
            </Description>
          </TextField>
        </form>
      </SettingsSection>

      <div className="space-y-3 px-0.5">
        <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-[var(--foreground)]">
          <Checkbox
            checked={ackOwnership}
            onCheckedChange={(value) => setAckOwnership(value === true)}
            className="mt-0.5"
            aria-label={s.ackOwnership}
          />
          <span>{s.ackOwnership}</span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-[var(--foreground)]">
          <Checkbox
            checked={ackSla}
            onCheckedChange={(value) => setAckSla(value === true)}
            className="mt-0.5"
            aria-label={s.ackSla}
          />
          <span>{s.ackSla}</span>
        </label>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {!isPro ? (
          <Button
            variant="secondary"
            isDisabled={upgradeBusy}
            onPress={() => void handleUpgrade()}
            className="w-full rounded-full sm:w-auto"
          >
            {upgradeBusy ? '…' : s.upgradeCta}
          </Button>
        ) : null}
        <Button
          type="submit"
          form="meta-portfolio-request-form"
          isDisabled={!canSubmit}
          className="w-full rounded-full sm:w-auto"
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
