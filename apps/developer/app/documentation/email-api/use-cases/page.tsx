import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCallout,
  DocCode,
  DocInlineCode,
  DocPager,
  DocSection,
  DocH3,
} from '@/components/documentation/docs-article';
import { EmailApiCodePanel } from '@/components/email-api/email-api-code-panel';
import { emailUseCasesCopy } from '@/lib/documentation-content/email-api/final-pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import { SEND_EMAIL_RECIPES } from '@/lib/email-api-code-samples';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), emailUseCasesCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function EmailApiUseCasesPage() {
  const c = docCopy(await getCurrentLocale(), emailUseCasesCopy);

  return (
    <DocumentationArticle
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="otp" title={c.toc[0]!.label}>
        <p>{c.otpBody}</p>
        <EmailApiCodePanel recipes={SEND_EMAIL_RECIPES.filter((r) => r.id === 'otp')} />
      </DocSection>

      <DocSection id="magic-link" title={c.toc[1]!.label}>
        <p>{c.magicBody}</p>
        <DocCode>{`await email.messages.send(
  {
    from: 'noreply@yourdomain.com',
    to: user.email,
    subject: 'Sign in to your account',
    bodyText: \`Open this link to continue: \${signInUrl}\`,
    bodyHtml: \`<p><a href="\${signInUrl}">Sign in</a></p><p>This link expires in 15 minutes.</p>\`,
  },
  { idempotencyKey: \`signin_\${user.id}_\${Date.now()}\` },
);`}</DocCode>
      </DocSection>

      <DocSection id="receipt" title={c.toc[2]!.label}>
        <p>{c.receiptBody}</p>
        <DocCode>{`await email.messages.send(
  {
    from: 'billing@yourdomain.com',
    fromName: 'Your App Billing',
    to: customer.email,
    subject: \`Receipt for order #\${order.id}\`,
    bodyText: \`Thanks. We charged \${order.total} IQD for order #\${order.id}.\`,
    bodyHtml: \`<p>Thanks for your purchase.</p><p>Order <strong>#\${order.id}</strong> — \${order.total} IQD</p>\`,
  },
  { idempotencyKey: \`receipt_\${order.id}\` },
);`}</DocCode>
        <DocCallout title={c.idemTitle}>
          {c.idemBody.includes('receipt_${order.id}') ? (
            <>
              {c.idemBody.split('receipt_${order.id}')[0]}
              <DocInlineCode>{`receipt_\${order.id}`}</DocInlineCode>
              {c.idemBody.split('receipt_${order.id}')[1]}
            </>
          ) : (
            c.idemBody
          )}
        </DocCallout>
      </DocSection>

      <DocSection id="security" title={c.toc[3]!.label}>
        <p>{c.securityBody}</p>
        <DocCode>{`await email.messages.send(
  {
    from: 'security@yourdomain.com',
    to: user.email,
    subject: 'New sign-in to your account',
    bodyText: \`We noticed a new sign-in at \${when} from \${city}. If this was not you, reset your password.\`,
  },
  { idempotencyKey: \`security_login_\${event.id}\` },
);`}</DocCode>
      </DocSection>

      <DocSection id="techniques" title={c.toc[4]!.label}>
        {c.techniques.map((item) => (
          <div key={item.title}>
            <DocH3>{item.title}</DocH3>
            <p>{item.body}</p>
          </div>
        ))}
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/email-api/get-started',
          label: c.prevLabel,
        }}
        next={{
          href: '/documentation/email-api/best-practices',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
