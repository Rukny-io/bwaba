import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocCode,
  DocPager,
  DocSection,
  DocSteps,
} from '@/components/documentation/docs-article';
import { whatsappGetStartedCopy } from '@/lib/documentation-content/whatsapp-api/remaining';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import {
  buildRecipeCodeSample,
  SEND_MESSAGE_RECIPES,
} from '@/lib/whatsapp-api-code-samples';

const firstText = SEND_MESSAGE_RECIPES.find((r) => r.id === 'text')!;

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), whatsappGetStartedCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function WhatsappApiGetStartedPage() {
  const c = docCopy(await getCurrentLocale(), whatsappGetStartedCopy);

  return (
    <DocumentationArticle
      productId="whatsapp-api"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="before-you-begin" title={c.toc[0]!.label}>
        <ul className="list-disc space-y-2 ps-5">
          {c.beforeItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="setup" title={c.setupTitle}>
        <DocSteps
          steps={c.steps.map((step) => ({
            title: step.title,
            body: <p>{step.body}</p>,
          }))}
        />
        <DocCallout title={c.tipTitle} tone="tip">
          {c.tipBody}
        </DocCallout>
      </DocSection>

      <DocSection id="send" title={c.sendTitle}>
        <p>{c.sendIntro}</p>
        <DocCode>{`npm install @rukny/whatsapp`}</DocCode>
        <DocCode language="ts">
          {buildRecipeCodeSample('node', firstText)}
        </DocCode>
        <p>
          {c.sendOtherBefore}{' '}
          <Link
            href="/documentation/whatsapp-api/send"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {c.sendLink}
          </Link>
          {c.sendOtherAfter}
        </p>
      </DocSection>

      <DocSection id="verify" title={c.verifyTitle}>
        <p>{c.verifyBody}</p>
      </DocSection>

      <DocSection id="next" title={c.nextTitle}>
        <ul className="list-disc space-y-2 ps-5">
          {c.nextItems.map((item) => (
            <li key={item.href}>
              {item.before}{' '}
              <Link
                href={item.href}
                className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
              >
                {item.link}
              </Link>{' '}
              {item.after}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/whatsapp-api', label: c.prevLabel }}
        next={{
          href: '/documentation/whatsapp-api/use-cases',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
