import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCallout,
  DocCode,
  DocInlineCode,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import { whatsappWebhooksCopy } from '@/lib/documentation-content/whatsapp-api/remaining';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import { WEBHOOK_EVENTS } from '@/lib/whatsapp-api-catalog';
import { WEBHOOK_VERIFY_SAMPLES } from '@/lib/whatsapp-api-code-samples';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), whatsappWebhooksCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function WhatsappApiWebhooksPage() {
  const c = docCopy(await getCurrentLocale(), whatsappWebhooksCopy);

  return (
    <DocumentationArticle
      productId="whatsapp-api"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="setup" title={c.toc[0]!.label}>
        <ol className="list-decimal space-y-2 ps-5">
          {c.setupSteps.map((step) => (
            <li key={step}>
              {step.includes('webhooks:manage') ? (
                <>
                  {step.split('webhooks:manage')[0]}
                  <DocInlineCode>webhooks:manage</DocInlineCode>
                  {step.split('webhooks:manage')[1]}
                </>
              ) : (
                step
              )}
            </li>
          ))}
        </ol>
      </DocSection>

      <DocSection id="events" title={c.toc[1]!.label}>
        <p>{c.eventsIntro}</p>
        <ul className="list-disc space-y-1.5 ps-5 font-mono text-[13px]">
          {WEBHOOK_EVENTS.map((event) => (
            <li key={event}>{event}</li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="verify" title={c.toc[2]!.label}>
        <p>
          {c.verifyBody.split('X-Rukny-Signature')[0]}
          <DocInlineCode>X-Rukny-Signature</DocInlineCode>
          {c.verifyBody.split('X-Rukny-Signature')[1]}
        </p>
        <DocCode>{WEBHOOK_VERIFY_SAMPLES.node}</DocCode>
        <DocCallout title={c.importantTitle} tone="warning">
          {c.importantBody}
        </DocCallout>
      </DocSection>

      <DocSection id="replay" title={c.toc[3]!.label}>
        <p>
          {c.replayBody.split('X-Rukny-Delivery')[0]}
          <DocInlineCode>X-Rukny-Delivery</DocInlineCode>
          {c.replayBody.split('X-Rukny-Delivery')[1]?.split('assertWebhookDeliveryNotReplayed')[0]}
          <DocInlineCode>assertWebhookDeliveryNotReplayed</DocInlineCode>
          {c.replayBody.split('assertWebhookDeliveryNotReplayed')[1]}
        </p>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/whatsapp-api/templates',
          label: c.prevLabel,
        }}
        next={{ href: '/documentation/whatsapp-api/errors', label: c.nextLabel }}
      />
    </DocumentationArticle>
  );
}
