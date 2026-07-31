'use client';

import { useState } from 'react';
import { ExternalLink, Loader2, Unlink } from 'lucide-react';
import { DeveloperEmbedLinkPanel } from '@/components/integrations/developer-embed-link-panel';
import { CodeSnippetCard } from '@/components/integrations/code-snippet-card';
import { ApiException } from '@/lib/api-client';
import { appToast } from '@/lib/app-toast';
import {
  unlinkFormFromDeveloperApp,
  type FormDeveloperEmbedLinked,
} from '@/lib/developer-embed-api';
import {
  buildEmbedListenerSnippet,
  buildIframeEmbedCode,
  getDeveloperAppDomainsUrl,
  getDeveloperAppFormsUrl,
  getPublicFormUrl,
} from '@/lib/developer-embed-urls';
import { cn } from '@/lib/utils';

const panelClassName = 'dashboard-panel shadow-none';

export function DeveloperEmbedSettingsPanel({
  formId,
  data,
  onChanged,
}: {
  formId: string;
  data: FormDeveloperEmbedLinked;
  onChanged: () => void;
}) {
  const [unlinking, setUnlinking] = useState(false);

  const publicUrl = getPublicFormUrl(data.slug, false);
  const iframeCode = buildIframeEmbedCode(data.slug);
  const listenerCode = buildEmbedListenerSnippet();
  const developersFormsUrl = getDeveloperAppFormsUrl(data.app.appId);
  const domainsUrl = getDeveloperAppDomainsUrl(data.app.appId);

  async function handleUnlink() {
    if (
      !window.confirm(
        'إلغاء ربط النموذج من تطبيق المطوّر؟ لن يعمل التضمين في موقعك حتى تعيد الربط.',
      )
    ) {
      return;
    }

    setUnlinking(true);
    try {
      await unlinkFormFromDeveloperApp(data.app.appId, formId);
      appToast.success('تم إلغاء الربط');
      onChanged();
    } catch (e) {
      appToast.error(
        e instanceof ApiException ? e.message : 'تعذّر إلغاء الربط',
      );
    } finally {
      setUnlinking(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className={cn(panelClassName, 'space-y-3')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              تطبيق المطوّر
            </h3>
            <p className="mt-1 text-sm text-[var(--foreground)]">{data.app.name}</p>
            <p className="mt-0.5 font-mono text-[10px] text-[var(--muted-foreground)]">
              {data.app.appId}
            </p>
          </div>
          <a
            href={developersFormsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--surface-secondary)] px-3 text-xs font-semibold text-[var(--foreground)] transition-opacity hover:opacity-90"
          >
            لوحة المطوّرين
            <ExternalLink className="size-3.5" />
          </a>
        </div>

        {data.embedReady ? (
          <p className="text-xs font-medium text-[var(--success)]">
            جاهز للتضمين في موقعك
          </p>
        ) : data.embed.requiresWebsiteOrOrigins ? (
          <div className="rounded-xl border border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_8%,var(--background))] px-4 py-3">
            <p className="text-xs leading-relaxed text-[var(--foreground)]">
              أضف رابط موقع التطبيق في إعدادات Domains لتفعيل التضمين.
            </p>
            <a
              href={domainsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex h-8 items-center rounded-full bg-[var(--primary)] px-4 text-xs font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
            >
              إدارة النطاق
            </a>
          </div>
        ) : data.status !== 'PUBLISHED' ? (
          <div className="rounded-xl border border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_8%,var(--background))] px-4 py-3 text-xs text-[var(--foreground)]">
            انشر النموذج قبل عرضه في موقعك عبر iframe.
          </div>
        ) : null}
      </section>

      {data.embed.websiteOrigin ? (
        <section className={cn(panelClassName, 'space-y-2')}>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            النطاق المسموح للتضمين
          </h3>
          <code
            dir="ltr"
            className="block rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5 font-mono text-[12px] text-[var(--foreground)]"
          >
            {data.embed.websiteOrigin}
          </code>
        </section>
      ) : null}

      <CodeSnippetCard
        title="رابط النموذج العام"
        code={publicUrl}
        copyLabel="نسخ الرابط"
        language="url"
      />

      <CodeSnippetCard
        title="كود iframe"
        description="الصق هذا الكود في صفحة موقعك لعرض النموذج"
        code={iframeCode}
        copyLabel="نسخ كود iframe"
        language="html"
      />

      <CodeSnippetCard
        title="مستمع الأحداث (اختياري)"
        description="استقبل إشعارات الإرسال وتغيّر الارتفاع من داخل iframe"
        code={listenerCode}
        copyLabel="نسخ الكود"
        language="javascript"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <p className="text-xs text-[var(--muted-foreground)]">
          يُسمح بتضمين النموذج على نطاق موقع التطبيق فقط.
        </p>
        <button
          type="button"
          disabled={unlinking}
          onClick={() => void handleUnlink()}
          className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--danger)] disabled:opacity-50"
        >
          {unlinking ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Unlink className="size-3.5" />
          )}
          إلغاء الربط
        </button>
      </div>
    </div>
  );
}

export function DeveloperEmbedUnlinkedPanel({
  formId,
  onLinked,
}: {
  formId: string;
  onLinked: () => void;
}) {
  return <DeveloperEmbedLinkPanel formId={formId} onLinked={onLinked} />;
}
