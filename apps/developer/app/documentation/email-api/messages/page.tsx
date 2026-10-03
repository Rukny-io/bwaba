import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCallout,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
  DocH3,
} from '@/components/documentation/docs-article';
import { EmailApiCodePanel } from '@/components/email-api/email-api-code-panel';
import { emailMessagesCopy } from '@/lib/documentation-content/email-api/final-pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import { MESSAGE_ENDPOINTS } from '@/lib/email-api-catalog';
import { SEND_EMAIL_RECIPES } from '@/lib/email-api-code-samples';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), emailMessagesCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function EmailApiMessagesDocsPage() {
  const c = docCopy(await getCurrentLocale(), emailMessagesCopy);
  const send = MESSAGE_ENDPOINTS[0]!;
  const status = MESSAGE_ENDPOINTS[1]!;

  return (
    <DocumentationArticle
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="send" title={c.toc[0]!.label}>
        <p>
          <DocInlineCode>
            {send.method} {send.path}
          </DocInlineCode>{' '}
          · {c.scopeLabel} <DocInlineCode>email:send</DocInlineCode>
        </p>
        <p>{c.summaries.sendMessage}</p>
        <EmailApiCodePanel recipes={SEND_EMAIL_RECIPES} />
      </DocSection>

      <DocSection id="fields" title={c.toc[1]!.label}>
        <DocTable
          headers={[...c.fieldHeaders]}
          rows={(send.fields ?? []).map((field) => [
            <DocInlineCode key={field.name}>{field.name}</DocInlineCode>,
            field.type,
            field.required ? c.yes : c.no,
            field.description,
          ])}
        />
      </DocSection>

      <DocSection id="status" title={c.toc[2]!.label}>
        <p>
          <DocInlineCode>
            {status.method} {status.path}
          </DocInlineCode>{' '}
          · {c.scopeLabel} <DocInlineCode>email:read</DocInlineCode>
        </p>
        <p>{c.summaries.getMessage}</p>
        <EmailApiCodePanel endpoint={status} defaultLanguage="sdk" />
      </DocSection>

      <DocSection id="lifecycle" title={c.toc[3]!.label}>
        <DocTable
          headers={[...c.statusHeaders]}
          rows={c.statuses.map(([code, meaning]) => [
            <DocInlineCode key={code}>{code}</DocInlineCode>,
            meaning,
          ])}
        />
        <DocH3>{c.privacyTitle}</DocH3>
        <p>{c.privacyBody}</p>
      </DocSection>

      <DocSection id="limits" title={c.toc[4]!.label}>
        <DocCallout>{c.limitsBody}</DocCallout>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/email-api/authentication',
          label: c.prevLabel,
        }}
        next={{ href: '/documentation/email-api/domains', label: c.nextLabel }}
      />
    </DocumentationArticle>
  );
}
