import type { WhatsappApiSummaryKey } from '@/lib/whatsapp-api-catalog';

type WhatsappApiDictionary =
  typeof import('@/dictionaries/en.json')['whatsappApi'];

export function whatsappApiSummariesFrom(
  d: WhatsappApiDictionary,
): Record<WhatsappApiSummaryKey, string> {
  return {
    epSendMessage: d.epSendMessage,
    epGetMessage: d.epGetMessage,
    epListTemplates: d.epListTemplates,
    epGetTemplate: d.epGetTemplate,
    epCreateTemplate: d.epCreateTemplate,
    epDeleteTemplate: d.epDeleteTemplate,
    epSyncTemplates: d.epSyncTemplates,
  };
}

export function whatsappApiErrorCopyFrom(
  d: WhatsappApiDictionary,
): Record<string, string> {
  return {
    errorUnauthorized: d.errorUnauthorized,
    errorForbidden: d.errorForbidden,
    errorNoWallet: d.errorNoWallet,
    errorNoWaba: d.errorNoWaba,
    errorTemplate: d.errorTemplate,
    errorPhone: d.errorPhone,
  };
}

/** Shared CTA / surface classes for WhatsApp API docs. */
export const waApiBtnPrimary =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--foreground)] px-3.5 text-[13px] font-medium text-[var(--background)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40';

export const waApiBtnSecondary =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--surface-secondary)] px-3.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_85%,var(--foreground)_6%)] disabled:cursor-not-allowed disabled:opacity-40';

export const waApiPanel = 'dashboard-panel p-4 sm:p-5';

export const waApiPanelFlush = 'dashboard-panel overflow-hidden p-0';

export const waApiCodeBlock =
  'overflow-x-auto rounded-xl bg-[var(--surface-secondary)] p-4 text-[12px] leading-relaxed text-[var(--foreground)]';
