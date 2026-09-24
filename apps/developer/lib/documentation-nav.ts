import { SEND_EXAMPLE_NAV_ITEMS } from '@/lib/email-api-send-catalog';

/** Public Meta-style documentation navigation (English, LTR). */

export const DOCUMENTATION_BASE = '/documentation';

export type DocumentationProductId = 'email-api' | 'forms' | 'whatsapp-api';

export interface DocumentationNavItem {
  slug: string;
  label: string;
  href: string;
}

export interface DocumentationNavGroup {
  label: string;
  items: DocumentationNavItem[];
  /** When true, the group can collapse in the sidebar (Resend-style). */
  collapsible?: boolean;
}

export interface DocumentationProduct {
  id: DocumentationProductId;
  title: string;
  description: string;
  href: string;
  available: boolean;
  nav: DocumentationNavItem[];
  navGroups?: DocumentationNavGroup[];
}

const emailBase = `${DOCUMENTATION_BASE}/email-api`;
const formsBase = `${DOCUMENTATION_BASE}/forms`;

export const EMAIL_API_DOC_NAV_GROUPS: DocumentationNavGroup[] = [
  {
    label: 'Guides',
    items: [
      { slug: '', label: 'Overview', href: emailBase },
      { slug: 'get-started', label: 'Get started', href: `${emailBase}/get-started` },
      { slug: 'use-cases', label: 'Use cases', href: `${emailBase}/use-cases` },
      {
        slug: 'best-practices',
        label: 'Best practices',
        href: `${emailBase}/best-practices`,
      },
    ],
  },
  {
    label: 'Core concepts',
    items: [
      {
        slug: 'authentication',
        label: 'Authentication',
        href: `${emailBase}/authentication`,
      },
      { slug: 'messages', label: 'Messages', href: `${emailBase}/messages` },
      { slug: 'domains', label: 'Domains', href: `${emailBase}/domains` },
      { slug: 'testing', label: 'Testing', href: `${emailBase}/testing` },
      { slug: 'quotas', label: 'Quotas & limits', href: `${emailBase}/quotas` },
      { slug: 'errors', label: 'Errors', href: `${emailBase}/errors` },
    ],
  },
  {
    label: 'Sending examples',
    collapsible: true,
    items: [
      { slug: 'send', label: 'Overview', href: `${emailBase}/send` },
      ...SEND_EXAMPLE_NAV_ITEMS,
    ],
  },
  {
    label: 'Build',
    items: [
      { slug: 'sdk', label: 'Node.js SDK', href: `${emailBase}/sdk` },
      { slug: 'rest', label: 'REST & curl', href: `${emailBase}/rest` },
      { slug: 'reference', label: 'API reference', href: `${emailBase}/reference` },
    ],
  },
];

export const EMAIL_API_DOC_NAV: DocumentationNavItem[] =
  EMAIL_API_DOC_NAV_GROUPS.flatMap((group) => group.items);

export const FORMS_DOC_NAV_GROUPS: DocumentationNavGroup[] = [
  {
    label: 'Guides',
    items: [
      { slug: '', label: 'Overview', href: formsBase },
      { slug: 'get-started', label: 'Get started', href: `${formsBase}/get-started` },
    ],
  },
  {
    label: 'Core concepts',
    items: [
      { slug: 'linking', label: 'Linking forms', href: `${formsBase}/linking` },
      { slug: 'domains', label: 'Website domain', href: `${formsBase}/domains` },
      { slug: 'embedding', label: 'Embedding', href: `${formsBase}/embedding` },
      { slug: 'events', label: 'Embed events', href: `${formsBase}/events` },
      { slug: 'webhooks', label: 'Webhooks', href: `${formsBase}/webhooks` },
    ],
  },
];

export const FORMS_DOC_NAV: DocumentationNavItem[] =
  FORMS_DOC_NAV_GROUPS.flatMap((group) => group.items);

export const DOCUMENTATION_PRODUCTS: DocumentationProduct[] = [
  {
    id: 'email-api',
    title: 'Email API',
    description:
      'Transactional email for OTPs, receipts, and product alerts — with verified domains and @rukny/email.',
    href: emailBase,
    available: true,
    nav: EMAIL_API_DOC_NAV,
    navGroups: EMAIL_API_DOC_NAV_GROUPS,
  },
  {
    id: 'forms',
    title: 'Forms',
    description:
      'Link Rukny forms to your app, embed them securely on your site, and react to submissions.',
    href: formsBase,
    available: true,
    nav: FORMS_DOC_NAV,
    navGroups: FORMS_DOC_NAV_GROUPS,
  },
  {
    id: 'whatsapp-api',
    title: 'WhatsApp API',
    description:
      'Send WhatsApp messages, templates, and OTPs with @rukny/whatsapp.',
    href: `${DOCUMENTATION_BASE}/whatsapp-api`,
    available: false,
    nav: [],
  },
];

export function getDocumentationProduct(
  id: DocumentationProductId,
): DocumentationProduct | undefined {
  return DOCUMENTATION_PRODUCTS.find((product) => product.id === id);
}

export function isDocNavActive(pathname: string, href: string): boolean {
  const roots = [
    `${DOCUMENTATION_BASE}/email-api`,
    `${DOCUMENTATION_BASE}/forms`,
    `${DOCUMENTATION_BASE}/email-api/send`,
  ];
  if (roots.includes(href)) {
    return pathname === href || pathname === `${href}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
