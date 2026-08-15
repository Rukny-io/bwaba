import { WHATSAPP_API_COPY } from '@/lib/whatsapp-api-copy';
import type { WhatsappApiSummaryKey } from '@/lib/whatsapp-api-catalog';

export function getWhatsappApiSummaries(): Record<
  WhatsappApiSummaryKey,
  string
> {
  const d = WHATSAPP_API_COPY;
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

export function getWhatsappApiErrorCopy(): Record<string, string> {
  const d = WHATSAPP_API_COPY;
  return {
    errorUnauthorized: d.errorUnauthorized,
    errorForbidden: d.errorForbidden,
    errorNoWallet: d.errorNoWallet,
    errorNoWaba: d.errorNoWaba,
    errorTemplate: d.errorTemplate,
    errorPhone: d.errorPhone,
  };
}
