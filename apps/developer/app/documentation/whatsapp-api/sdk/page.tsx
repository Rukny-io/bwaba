import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocCode,
  DocInlineCode,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import { whatsappSdkCopy } from '@/lib/documentation-content/whatsapp-api/remaining';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), whatsappSdkCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function WhatsappApiSdkPage() {
  const c = docCopy(await getCurrentLocale(), whatsappSdkCopy);

  return (
    <DocumentationArticle
      productId="whatsapp-api"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="install" title={c.toc[0]!.label}>
        <DocCode>{`npm install @rukny/whatsapp`}</DocCode>
      </DocSection>

      <DocSection id="quickstart" title={c.toc[1]!.label}>
        <DocCode language="ts">{`import { RuknyWhatsApp } from '@rukny/whatsapp';

const wa = new RuknyWhatsApp({
  apiKey: process.env.RUKNY_API_KEY!,
});

await wa.messages.sendText({
  to: '+9647xxxxxxxxx',
  body: 'Hello from Rukny!',
});

await wa.messages.sendTemplate({
  to: '+9647xxxxxxxxx',
  name: 'order_confirmation',
  language: 'ar',
  variables: ['Ahmed', '#12345'],
});

await wa.messages.sendOtp({
  to: '+9647xxxxxxxxx',
  code: '483920',
  template: 'otp_verify',
  language: 'ar',
});`}</DocCode>
        <DocCallout title={c.tipTitle} tone="tip">
          {c.tipBody}
        </DocCallout>
      </DocSection>

      <DocSection id="methods" title={c.toc[2]!.label}>
        <ul className="list-disc space-y-2 ps-5 font-mono text-[13px]">
          <li>messages.sendText()</li>
          <li>messages.sendTemplate()</li>
          <li>messages.sendOtp()</li>
          <li>messages.getStatus()</li>
          <li>templates.list()</li>
          <li>templates.get(name)</li>
          <li>verifyWebhookSignature()</li>
        </ul>
        <p>
          {c.methodsIntro}{' '}
          <Link
            href="/documentation/whatsapp-api/send"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {c.methodsLink}
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="webhooks" title={c.toc[3]!.label}>
        <p>
          {c.webhooksBefore.split('verifyWebhookSignature')[0]}
          <DocInlineCode>verifyWebhookSignature</DocInlineCode>
          {c.webhooksBefore.split('verifyWebhookSignature')[1]}{' '}
          <Link
            href="/documentation/whatsapp-api/webhooks"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {c.webhooksLink}
          </Link>{' '}
          {c.webhooksAfter}
        </p>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/whatsapp-api/send/otp',
          label: c.prevLabel,
        }}
        next={{
          href: '/documentation/whatsapp-api/rest',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
