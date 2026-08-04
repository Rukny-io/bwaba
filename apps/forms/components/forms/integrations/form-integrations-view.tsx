'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@heroui/react';
import { ArrowLeft, Webhook } from 'lucide-react';
import { INTEGRATION_LOGOS } from '@/lib/integration-logos';
import { SubmissionsGoogleSheetsPanel } from '@/components/forms/submissions/submissions-google-sheets';
import {
  FormIntegrationCard,
  type IntegrationCardStatus,
} from '@/components/forms/integrations/form-integration-card';
import { GoogleDriveSettingsPanel } from '@/components/integrations/google-drive-settings-panel';
import { EmailSettingsPanel } from '@/components/integrations/email-settings-panel';
import { SheetsConnectedBanner } from '@/components/integrations/sheets-connected-banner';
import { WebhookSettingsPanel } from '@/components/integrations/webhook-settings-panel';
import { WebhookDeliveriesPanel } from '@/components/integrations/webhook-deliveries-panel';
import {
  DeveloperEmbedSettingsPanel,
  DeveloperEmbedUnlinkedPanel,
} from '@/components/integrations/developer-embed-settings-panel';
import { PlanFeatureGate } from '@/components/plan/plan-feature-gate';
import { ApiException } from '@/lib/api-client';
import { getForm, type FormDetail } from '@/lib/forms-api';
import {
  getPermissionDeniedCopy,
  hasFormTeamPermission,
  resolveFormAccessRole,
} from '@/lib/form-team-permissions';
import { FormPermissionDeniedState } from '@/components/forms/shared/form-permission-denied-state';
import { DashboardEmptyState } from '@/components/app/dashboard-empty-state';
import { DashboardErrorState } from '@/components/app/dashboard-error-state';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import { getGoogleDriveStatus } from '@/lib/google-drive-api';
import {
  getFormIntegrationsRow,
  type IntegrationsFormRow,
} from '@/lib/integrations-api';
import { formatRelativeTime } from '@/lib/integrations-format';
import { formatNumber } from '@/lib/dashboard-format';
import {
  getFormDeveloperEmbed,
  type FormDeveloperEmbed,
  type FormDeveloperEmbedLinked,
} from '@/lib/developer-embed-api';

export type FormIntegrationId =
  | 'sheets'
  | 'drive'
  | 'webhook'
  | 'email'
  | 'developer';

const RETURN_TAB_KEY = 'integrations-return-tab';

const COMING_SOON = [
  {
    logo: INTEGRATION_LOGOS.make,
    title: 'Make',
    description: 'أرسل الاستجابات إلى أدواتك المفضلة',
  },
  {
    logo: INTEGRATION_LOGOS.n8n,
    title: 'n8n',
    description: 'أتمتة سير العمل بصرياً عند كل استجابة',
  },
  {
    logo: INTEGRATION_LOGOS.zapier,
    title: 'Zapier',
    description: 'اربط آلاف التطبيقات بدون كود',
  },
  {
    logo: INTEGRATION_LOGOS.slack,
    title: 'Slack',
    description: 'إشعار فوري في قناة الفريق عند كل استجابة',
  },
] as const;

const INTEGRATION_TITLES: Record<FormIntegrationId, string> = {
  sheets: 'Google Sheets',
  drive: 'Google Drive',
  webhook: 'Webhook',
  email: 'تنبيهات البريد',
  developer: 'تضمين في موقعك',
};

function clearOAuthQueryParams() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('sheets_connected');
  url.searchParams.delete('sheets_error');
  const qs = url.searchParams.toString();
  window.history.replaceState(null, '', `${url.pathname}${qs ? `?${qs}` : ''}`);
}

export function FormIntegrationsView({ formId }: { formId: string }) {
  const searchParams = useSearchParams();
  const [formAccess, setFormAccess] = useState<FormDetail | null>(null);
  const [form, setForm] = useState<IntegrationsFormRow | null>(null);
  const [developerEmbed, setDeveloperEmbed] =
    useState<FormDeveloperEmbed | null>(null);
  const [driveConnected, setDriveConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [selected, setSelected] = useState<FormIntegrationId | null>(null);
  const [sheetsJustConnected, setSheetsJustConnected] = useState(false);
  const [sheetsOAuthError, setSheetsOAuthError] = useState<string | null>(null);
  const [oauthHandled, setOauthHandled] = useState(false);
  const accessRole = formAccess ? resolveFormAccessRole(formAccess) : 'OWNER';
  const permissionDeniedCopy = getPermissionDeniedCopy(
    'manage_integrations',
    accessRole,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAccessDenied(false);
    try {
      const formData = await getForm(formId);
      setFormAccess(formData);
      const role = resolveFormAccessRole(formData);
      if (!hasFormTeamPermission(role, 'manage_integrations')) {
        setAccessDenied(true);
        setForm(null);
        return;
      }

      const [row, drive, embed] = await Promise.all([
        getFormIntegrationsRow(formId),
        getGoogleDriveStatus(formId).catch(() => ({ connected: false })),
        getFormDeveloperEmbed(formId).catch(() => ({ linked: false } as const)),
      ]);
      setForm(row);
      setDriveConnected(drive.connected);
      setDeveloperEmbed(embed);
    } catch (e) {
      if (e instanceof ApiException && e.statusCode === 403) {
        setAccessDenied(true);
        setForm(null);
      } else {
        setError(
          e instanceof ApiException ? e.message : 'تعذّر تحميل التكاملات',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    void load();
  }, [load]);

  useEffect(() => {
    if (!form || oauthHandled) return;

    const connected = searchParams.get('sheets_connected') === 'true';
    const oauthError = searchParams.get('sheets_error') === 'true';

    if (oauthError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- OAuth redirect handling
      setSheetsOAuthError('تعذّر ربط Google Sheets. حاول مرة أخرى.');
      clearOAuthQueryParams();
      setOauthHandled(true);
      return;
    }

    if (connected) {
      setSelected('sheets');
      setSheetsJustConnected(true);
      clearOAuthQueryParams();
      void load();
      setOauthHandled(true);
      return;
    }

    const returnTab = sessionStorage.getItem(RETURN_TAB_KEY) as
      | FormIntegrationId
      | null;
    if (returnTab === 'drive') {
      setSelected('drive');
      sessionStorage.removeItem(RETURN_TAB_KEY);
    }

    setOauthHandled(true);
  }, [form, searchParams, oauthHandled, load]);

  const connectedCount = useMemo(() => {
    if (!form) return 0;
    let count = 0;
    if (form.googleSheets.connected) count += 1;
    if (driveConnected) count += 1;
    if (form.webhook.configured) count += 1;
    if (form.email.configured) count += 1;
    if (developerEmbed?.linked) count += 1;
    return count;
  }, [form, driveConnected, developerEmbed]);

  if (loading && !form) {
    return (
      <div className="flex flex-col gap-5 sm:gap-6">
        <Skeleton className="h-5 w-64 max-w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl sm:rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <FormPermissionDeniedState
        title={permissionDeniedCopy.title}
        description={permissionDeniedCopy.description}
        actionHref={`/app/forms/${formId}`}
        actionLabel="العودة لإعدادات النموذج"
      />
    );
  }

  if (error || !form) {
    return (
      <DashboardErrorState
        variant="inline"
        message={error ?? 'لا توجد بيانات'}
        onRetry={() => void load()}
      />
    );
  }

  if (selected) {
    return (
      <div className="flex flex-col gap-5 sm:gap-6">
        <DashboardSurface padding="md">
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setSheetsJustConnected(false);
              void load();
            }}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            رجوع للبطاقات
          </button>

          <h2 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
            {INTEGRATION_TITLES[selected]}
          </h2>
          <p className="mt-1 text-xs text-[var(--muted-foreground)] sm:text-[13px]">
            إعداد التكامل لهذا النموذج
          </p>

          {selected === 'sheets' && sheetsJustConnected ? (
            <div className="mt-5">
              <SheetsConnectedBanner
                form={form}
                onRefresh={() => void load()}
                onDismiss={() => setSheetsJustConnected(false)}
              />
            </div>
          ) : null}

          <div className={selected === 'sheets' && sheetsJustConnected ? '' : 'mt-6'}>
            {selected === 'sheets' ? (
              <PlanFeatureGate feature="googleSheets">
                <SubmissionsGoogleSheetsPanel formId={form.id} />
              </PlanFeatureGate>
            ) : null}
            {selected === 'drive' ? (
              <PlanFeatureGate feature="googleDrive">
                <GoogleDriveSettingsPanel
                  formId={form.id}
                  onOpenSheetsTab={() => setSelected('sheets')}
                  justConnected={sheetsJustConnected}
                  onDismissConnected={() => setSheetsJustConnected(false)}
                />
              </PlanFeatureGate>
            ) : null}
            {selected === 'webhook' ? (
              <div className="space-y-6">
                <PlanFeatureGate feature="webhook">
                  <WebhookSettingsPanel form={form} onSaved={() => void load()} />
                </PlanFeatureGate>
                {form.webhook.configured ? (
                  <WebhookDeliveriesPanel formId={form.id} />
                ) : null}
              </div>
            ) : null}
            {selected === 'email' ? (
              <EmailSettingsPanel form={form} onSaved={() => void load()} />
            ) : null}
            {selected === 'developer' ? (
              developerEmbed?.linked ? (
                <DeveloperEmbedSettingsPanel
                  formId={form.id}
                  data={developerEmbed as FormDeveloperEmbedLinked}
                  onChanged={() => {
                    setSelected(null);
                    void load();
                  }}
                />
              ) : (
                <DeveloperEmbedUnlinkedPanel
                  formId={form.id}
                  onLinked={() => void load()}
                />
              )
            ) : null}
          </div>
        </DashboardSurface>
      </div>
    );
  }

  const sheets = form.googleSheets;
  const sheetsStatus: IntegrationCardStatus = sheets.connected
    ? 'connected'
    : 'inactive';
  const driveStatus: IntegrationCardStatus = driveConnected
    ? 'connected'
    : 'inactive';
  const webhookStatus: IntegrationCardStatus = form.webhook.configured
    ? 'connected'
    : 'inactive';
  const emailStatus: IntegrationCardStatus = form.email.configured
    ? 'connected'
    : 'inactive';
  const developerLinked = Boolean(developerEmbed?.linked);
  const developerEmbedReady =
    developerLinked && developerEmbed?.linked
      ? developerEmbed.embedReady
      : false;
  const developerStatus: IntegrationCardStatus = developerLinked
    ? 'connected'
    : 'inactive';

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <DashboardSurface padding="sm" className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
            اربط هذا النموذج بالتطبيقات الخارجية — الاستجابات تُرسل تلقائياً دون
            تصدير يدوي.
          </p>
        </div>
        {connectedCount > 0 ? (
          <span className="shrink-0 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[12px] font-semibold text-[var(--primary)]">
            {formatNumber(connectedCount)} تكامل{' '}
            {connectedCount === 1 ? 'مفعّل' : 'مفعّلة'}
          </span>
        ) : null}
      </DashboardSurface>

      {sheetsOAuthError ? (
        <DashboardErrorState
          variant="inline"
          message={sheetsOAuthError}
          retryLabel="إغلاق"
          onRetry={() => setSheetsOAuthError(null)}
        />
      ) : null}

      {connectedCount === 0 ? (
        <DashboardEmptyState
          compact
          title="لم تربط أي تكامل بعد"
          description="ابدأ بـ Google Sheets أو Webhook"
        />
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          التكاملات المتاحة
        </h2>
        <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 xl:grid-cols-4">
          <FormIntegrationCard
            logo={INTEGRATION_LOGOS.googleSheets}
            title="Google Sheets"
            description="كل استجابة جديدة تُضاف للجدول — يدوياً أو تلقائياً"
            status={sheetsStatus}
            statusLabel={
              sheets.connected
                ? sheets.isAutoSync
                  ? 'متصل · تلقائي'
                  : 'متصل'
                : 'غير مفعّل'
            }
            detailLine={
              sheets.connected && sheets.syncedCount > 0
                ? `${formatNumber(sheets.syncedCount)} صف مُزامَن${
                    sheets.lastSyncAt
                      ? ` · آخر مزامنة ${formatRelativeTime(sheets.lastSyncAt)}`
                      : ''
                  }`
                : null
            }
            onAction={() => setSelected('sheets')}
            actionLabel={sheets.connected ? 'إدارة' : 'ربط'}
          />

          <FormIntegrationCard
            logo={INTEGRATION_LOGOS.googleDrive}
            title="Google Drive"
            description="تخزين المرفقات والتوقيعات في Drive بدل التخزين المحلي"
            status={driveStatus}
            statusLabel={driveConnected ? 'متصل' : 'غير مفعّل'}
            onAction={() => setSelected('drive')}
            actionLabel={driveConnected ? 'إدارة' : 'ربط'}
          />

          <FormIntegrationCard
            icon={Webhook}
            title="Webhook"
            description="أرسل كل استجابة إلى أي رابط يقبل POST"
            status={webhookStatus}
            statusLabel={form.webhook.configured ? 'نشط' : 'غير مفعّل'}
            detailLine={
              form.webhook.configured && form.webhook.url
                ? form.webhook.url.length > 48
                  ? `${form.webhook.url.slice(0, 48)}…`
                  : form.webhook.url
                : null
            }
            onAction={() => setSelected('webhook')}
            actionLabel={form.webhook.configured ? 'إدارة' : 'إعداد'}
          />

          <FormIntegrationCard
            logo={INTEGRATION_LOGOS.gmail}
            title="تنبيهات البريد"
            description="استلم بريداً فورياً عند كل استجابة جديدة"
            status={emailStatus}
            statusLabel={form.email.configured ? 'مفعّل' : 'غير مفعّل'}
            detailLine={form.email.address ?? null}
            onAction={() => setSelected('email')}
            actionLabel={form.email.configured ? 'إدارة' : 'تفعيل'}
          />

          <FormIntegrationCard
            logo={INTEGRATION_LOGOS.developers}
            title="تضمين في موقعك"
            description="اربط النموذج بتطبيقك واعرضه في موقعك عبر iframe"
            status={developerStatus}
            statusLabel={
              developerLinked
                ? developerEmbedReady
                  ? 'مربوط · جاهز'
                  : 'مربوط'
                : 'غير مربوط'
            }
            detailLine={
              developerLinked && developerEmbed?.linked
                ? developerEmbed.app.name
                : null
            }
            onAction={() => setSelected('developer')}
            actionLabel={developerLinked ? 'إدارة' : 'ربط'}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            قريباً
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
            تكاملات إضافية قيد التحضير
          </p>
        </div>
        <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 xl:grid-cols-4">
          {COMING_SOON.map((item) => (
            <FormIntegrationCard
              key={item.title}
              logo={item.logo}
              title={item.title}
              description={item.description}
              status="coming_soon"
              statusLabel="قريباً"
              comingSoon
            />
          ))}
        </div>
      </section>
    </div>
  );
}
