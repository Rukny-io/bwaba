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
import { SEND_EMAIL_RECIPES } from '@/lib/email-api-code-samples';

export const metadata: Metadata = {
  title: 'Use cases — Email API | Rukny Documentation',
  description:
    'Practical Email API patterns for OTPs, magic links, receipts, and alerts.',
};

const TOC = [
  { id: 'otp', label: 'OTP / verification' },
  { id: 'magic-link', label: 'Magic link' },
  { id: 'receipt', label: 'Receipt' },
  { id: 'security', label: 'Security alert' },
  { id: 'techniques', label: 'Techniques' },
];

export default function EmailApiUseCasesPage() {
  return (
    <DocumentationArticle
      title="Use cases"
      description="Copy-ready patterns for the most common transactional emails. Each example assumes a verified domain and authorized sender."
      toc={TOC}
    >
      <DocSection id="otp" title="OTP / verification code">
        <p>
          Keep the code short-lived, put it in both subject and body when
          helpful, and always use a unique idempotency key per attempt.
        </p>
        <EmailApiCodePanel recipes={SEND_EMAIL_RECIPES.filter((r) => r.id === 'otp')} />
      </DocSection>

      <DocSection id="magic-link" title="Magic link / sign-in">
        <p>
          Prefer a single CTA URL. Avoid nesting tracking redirects that break
          deliverability. Expire the token server-side.
        </p>
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

      <DocSection id="receipt" title="Order or payment receipt">
        <p>
          Keep receipts plain and scannable. Include order id in the subject for
          searchability. Store the returned message id with the order record.
        </p>
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
        <DocCallout title="Idempotency tip">
          Using <DocInlineCode>{`receipt_\${order.id}`}</DocInlineCode> means a
          retry after a timeout returns the original send instead of emailing
          twice.
        </DocCallout>
      </DocSection>

      <DocSection id="security" title="Security alert">
        <p>
          Send from a recognizable address. Include when and where the action
          happened, plus a clear recovery path.
        </p>
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

      <DocSection id="techniques" title="Techniques that work well">
        <DocH3>Stable idempotency keys</DocH3>
        <p>
          Derive keys from business ids (<DocInlineCode>order_123</DocInlineCode>,{' '}
          <DocInlineCode>otp_user_456_attempt_2</DocInlineCode>) instead of random
          UUIDs when you want natural dedupe.
        </p>
        <DocH3>Text + HTML together</DocH3>
        <p>
          Provide both <DocInlineCode>bodyText</DocInlineCode> and{' '}
          <DocInlineCode>bodyHtml</DocInlineCode> for better client compatibility.
          At least one is required.
        </p>
        <DocH3>Store the message id</DocH3>
        <p>
          Persist <DocInlineCode>result.id</DocInlineCode> next to the user action
          so support can look up delivery status later.
        </p>
        <DocH3>Test then live</DocH3>
        <p>
          Validate templates with <DocInlineCode>rk_test_</DocInlineCode> keys,
          then swap to <DocInlineCode>rk_live_</DocInlineCode> without changing
          your code path.
        </p>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/email-api/get-started',
          label: 'Get started',
        }}
        next={{
          href: '/documentation/email-api/best-practices',
          label: 'Best practices',
        }}
      />
    </DocumentationArticle>
  );
}
