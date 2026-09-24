/** English-only copy for Email API portal docs (LTR island). */

export const EMAIL_API_COPY = {
  title: 'Email API',
  subtitle:
    'Send OTPs, sign-in links, delivery updates, and transactional notifications from your verified domain.',
  createKey: 'Create API key',
  documentation: 'Documentation',
  usagePlan: 'Usage & plan',
  copy: 'Copy',

  overviewTitle: 'Get started',
  overviewDesc:
    'Email API sends transactional messages from verified, app-authorized senders. Each account receives 1,000 free messages once. Email API Starter is 6,000 IQD/month for 10,000 monthly messages.',
  overviewStep1: 'Verify a domain and authorize a sender for this application.',
  overviewStep2: 'Create a scoped API key with email:send.',
  overviewStep3: 'Install @rukny/email or call the REST API with an Idempotency-Key.',
  overviewStep4: 'Monitor statuses and resolve bounces before they affect deliverability.',
  overviewPublicDocs: 'Read the full public documentation',
  overviewMessagesCard: 'Messages',
  overviewMessagesDesc: 'Send a message and read its status.',
  overviewDomainsCard: 'Domains',
  overviewDomainsDesc: 'Verify and authorize your sender.',
  overviewSdksCard: 'SDKs',
  overviewSdksDesc: 'Install @rukny/email and send in a few lines.',
  overviewTryCard: 'Try it',
  overviewTryDesc: 'Send a safe test message from the portal.',

  authTitle: 'Authentication',
  authDesc:
    'Create an app-scoped key with only the required permissions. Keep it on your server; never expose it in a browser or mobile client.',
  authScopesTitle: 'Scopes',
  authSecurityTitle: 'Security',
  authSecurity1: 'Restrict production keys with an IP allowlist and expiry date.',
  authSecurity2: 'Rotate and revoke a key immediately if it is exposed.',
  authSecurity3: 'Use a distinct key per environment and backend service.',
  authSecurity4:
    'Idempotency keys prevent duplicate billing and duplicate sends during retries.',

  messagesTitle: 'Messages',
  messagesDesc:
    'One recipient per request in the MVP. The sender must be verified and explicitly linked to this app.',

  smtpTitle: 'SMTP',
  smtpDesc:
    'Send from Laravel, Nodemailer, WordPress, or any SMTP client. Use username rukny and your API key as the password — same scopes, quotas, and verified senders as REST.',
  smtpDocsLink: 'SMTP setup guide',
  smtpNodemailerTitle: 'Nodemailer',
  smtpLaravelTitle: 'Laravel .env',

  domainsDeliverabilityTitle: 'Deliverability protection',
  domainsDeliverabilityDesc:
    'Hard bounces and spam complaints suppress the recipient for your account. A suspicious increase in either can automatically pause sending pending review.',

  errorsTitle: 'Errors',
  errorsDesc:
    'The Email API returns standard HTTP status codes. Failed SDK calls throw RuknyEmailError with status and body.',

  sdksTitle: 'Node.js SDK',
  sdksDesc:
    'Prefer @rukny/email over hand-rolled REST calls. The client handles headers, idempotency, and typed errors.',
  sdksQuickstartTitle: 'Quickstart',
  sdksMethodsTitle: 'Methods',
  sdksDocsHint: 'Full guides and reference live in the public documentation.',
} as const;
