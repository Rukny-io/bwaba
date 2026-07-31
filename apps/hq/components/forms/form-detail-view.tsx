'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  ExternalLink,
  FileText,
  ListTree,
  Loader2,
  Settings2,
  Webhook,
  type LucideIcon,
} from 'lucide-react';
import { Button, Chip } from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type { AdminFormDetail } from '@/lib/types/forms';
import { FormOverviewPanel } from '@/components/forms/form-overview-panel';
import { FormDeletionPanel } from '@/components/forms/form-deletion-panel';
import { FormFieldsPanel } from '@/components/forms/form-fields-panel';
import { FormSettingsPanel } from '@/components/forms/form-settings-panel';
import { FormWebhookPanel } from '@/components/forms/form-webhook-panel';
import { getFormEditorUrl, getFormPreviewUrl } from '@/lib/forms-url';
import {
  formatFormStatus,
  formatFormType,
  formStatusChipColor,
} from '@/lib/forms-format';
import { resolveMediaUrl } from '@/lib/media-url';
import {
  workspaceTabClassName,
  workspaceTabGroupClassName,
} from '@/components/ui/pill-tab';

type FormDetailTab = 'overview' | 'fields' | 'settings' | 'webhooks';

const TAB_IDS: FormDetailTab[] = ['overview', 'fields', 'settings', 'webhooks'];

const TABS: { id: FormDetailTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'fields', label: 'Fields', icon: ListTree },
  { id: 'settings', label: 'Settings', icon: Settings2 },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
];

function parseTabParam(value: string | null): FormDetailTab {
  if (value && TAB_IDS.includes(value as FormDetailTab)) {
    return value as FormDetailTab;
  }
  return 'overview';
}

interface FormDetailViewProps {
  formId: string;
}

export function FormDetailView({ formId }: FormDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<AdminFormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FormDetailTab>(() =>
    parseTabParam(searchParams.get('tab')),
  );

  useEffect(() => {
    setActiveTab(parseTabParam(searchParams.get('tab')));
  }, [searchParams]);

  const loadForm = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hqApi.getForm(formId);
      setForm(data);
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load form details',
      );
      router.replace('/app/forms');
    } finally {
      setLoading(false);
    }
  }, [formId, router]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  if (loading || !form) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const coverUrl = resolveMediaUrl(form.coverImage);

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <Link
            href="/app/forms"
            className="inline-flex items-center gap-1 rounded-lg py-0.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            Forms
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {form.deletedAt ? (
              <Chip color="danger" size="sm" variant="soft">
                Deleted
              </Chip>
            ) : null}
            <Chip color={formStatusChipColor(form.status)} size="sm" variant="soft">
              {formatFormStatus(form.status)}
            </Chip>
            <span className="inline-flex rounded-full bg-[var(--surface-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted-foreground)]">
              {formatFormType(form.type)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="size-full object-cover" />
            ) : (
              <FileText className="size-6" aria-hidden />
            )}
          </div>
          <div className="min-w-0 max-w-lg">
            <h1 className="truncate text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
              {form.title}
            </h1>
            <p className="mt-0.5 truncate font-mono text-sm text-[var(--muted-foreground)]" dir="ltr">
              /{form.slug}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              size="sm"
              variant="tertiary"
              className="rounded-lg"
              onPress={() =>
                window.open(getFormPreviewUrl(form.slug), '_blank', 'noopener,noreferrer')
              }
            >
              <ExternalLink className="size-3.5" />
              Preview
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              className="rounded-lg"
              onPress={() =>
                window.open(getFormEditorUrl(form.id), '_blank', 'noopener,noreferrer')
              }
            >
              Open in Forms
            </Button>
          </div>
        </div>

        <nav
          className={workspaceTabGroupClassName}
          aria-label="Form detail sections"
          role="tablist"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveTab(tab.id);
                  const params = new URLSearchParams(searchParams.toString());
                  if (tab.id === 'overview') {
                    params.delete('tab');
                  } else {
                    params.set('tab', tab.id);
                  }
                  const qs = params.toString();
                  router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
                }}
                className={workspaceTabClassName(isActive)}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <div role="tabpanel">
        {activeTab === 'overview' ? (
          <div className="space-y-4">
            <FormDeletionPanel form={form} />
            <FormOverviewPanel form={form} />
          </div>
        ) : null}
        {activeTab === 'fields' ? <FormFieldsPanel form={form} /> : null}
        {activeTab === 'settings' ? <FormSettingsPanel form={form} /> : null}
        {activeTab === 'webhooks' ? (
          <FormWebhookPanel formId={form.id} webhookEnabled={form.webhookEnabled} />
        ) : null}
      </div>
    </div>
  );
}
