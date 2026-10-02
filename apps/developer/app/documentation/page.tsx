import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  DOCUMENTATION_BASE,
  DOCUMENTATION_PRODUCTS,
} from '@/lib/documentation-nav';
import { cn } from '@/lib/utils';

type HubLink = {
  label: string;
  href: string;
};

type HubSection = {
  title: string;
  links: HubLink[];
};

const FEATURED = DOCUMENTATION_PRODUCTS.map((product) => ({
  title: product.title,
  description: product.description,
  href: product.href,
  available: product.available,
}));

const SECTIONS: HubSection[] = [
  {
    title: 'Email API',
    links: [
      { label: 'Overview', href: `${DOCUMENTATION_BASE}/email-api` },
      { label: 'Get started', href: `${DOCUMENTATION_BASE}/email-api/get-started` },
      { label: 'Use cases', href: `${DOCUMENTATION_BASE}/email-api/use-cases` },
      { label: 'Best practices', href: `${DOCUMENTATION_BASE}/email-api/best-practices` },
      { label: 'Messages', href: `${DOCUMENTATION_BASE}/email-api/messages` },
      { label: 'Domains', href: `${DOCUMENTATION_BASE}/email-api/domains` },
      { label: 'Testing', href: `${DOCUMENTATION_BASE}/email-api/testing` },
      { label: 'Quotas & limits', href: `${DOCUMENTATION_BASE}/email-api/quotas` },
      { label: 'Errors', href: `${DOCUMENTATION_BASE}/email-api/errors` },
    ],
  },
  {
    title: 'Forms',
    links: [
      { label: 'Overview', href: `${DOCUMENTATION_BASE}/forms` },
      { label: 'Get started', href: `${DOCUMENTATION_BASE}/forms/get-started` },
      { label: 'Linking forms', href: `${DOCUMENTATION_BASE}/forms/linking` },
      { label: 'Website domain', href: `${DOCUMENTATION_BASE}/forms/domains` },
      { label: 'Embedding', href: `${DOCUMENTATION_BASE}/forms/embedding` },
      { label: 'Embed events', href: `${DOCUMENTATION_BASE}/forms/events` },
      { label: 'Webhooks', href: `${DOCUMENTATION_BASE}/forms/webhooks` },
    ],
  },
  {
    title: 'Authentication',
    links: [
      {
        label: 'API authentication',
        href: `${DOCUMENTATION_BASE}/email-api/authentication`,
      },
      { label: 'Developer dashboard', href: '/login?next=/apps' },
    ],
  },
  {
    title: 'SDKs & reference',
    links: [
      { label: 'Node.js SDK', href: `${DOCUMENTATION_BASE}/email-api/sdk` },
      { label: 'REST & curl', href: `${DOCUMENTATION_BASE}/email-api/rest` },
      { label: 'API reference', href: `${DOCUMENTATION_BASE}/email-api/reference` },
      { label: 'Sending examples', href: `${DOCUMENTATION_BASE}/email-api/send` },
    ],
  },
  {
    title: 'Developer guides',
    links: [
      { label: 'Email API overview', href: `${DOCUMENTATION_BASE}/email-api` },
      { label: 'Forms overview', href: `${DOCUMENTATION_BASE}/forms` },
      { label: 'Embed a form', href: `${DOCUMENTATION_BASE}/forms/get-started` },
      { label: 'SMTP', href: `${DOCUMENTATION_BASE}/email-api/smtp` },
    ],
  },
  {
    title: 'Messaging',
    links: [
      { label: 'Email messages', href: `${DOCUMENTATION_BASE}/email-api/messages` },
      { label: 'Forms webhooks', href: `${DOCUMENTATION_BASE}/forms/webhooks` },
      { label: 'Email testing', href: `${DOCUMENTATION_BASE}/email-api/testing` },
    ],
  },
];

function FeaturedCard({
  title,
  description,
  href,
  available,
}: {
  title: string;
  description: string;
  href: string;
  available: boolean;
}) {
  const inner = (
    <article
      className={cn(
        'group flex h-full min-h-[11rem] flex-col justify-between rounded-xl border border-[var(--border)]/50 bg-[var(--surface)] p-5 transition-colors sm:p-6',
        available &&
          'hover:bg-[color-mix(in_srgb,var(--surface-secondary)_40%,var(--surface))]',
        !available && 'opacity-70',
      )}
    >
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)] sm:text-xl">
          {title}
        </h2>
        <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)] sm:text-[14px] sm:leading-6">
          {description}
        </p>
      </div>
      <p className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--foreground)]">
        {available ? (
          <>
            Docs
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </>
        ) : (
          <span className="text-[var(--muted-foreground)]">Coming soon</span>
        )}
      </p>
    </article>
  );

  if (!available) return <div>{inner}</div>;
  return (
    <Link href={href} className="block">
      {inner}
    </Link>
  );
}

function DocsSection({ section }: { section: HubSection }) {
  return (
    <section className="min-w-0">
      <h2 className="text-[15px] font-semibold text-[var(--foreground)]">
        {section.title}
      </h2>
      <ul className="mt-3 space-y-2">
        {section.links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              className="text-[13px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function DocumentationHubPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <header className="max-w-3xl">
        <h1 className="text-[2rem] font-semibold tracking-tight text-[var(--foreground)] sm:text-[2.75rem] sm:leading-[1.15]">
          Rukny Developer Documentation
        </h1>
        <p className="mt-4 text-[15px] leading-7 text-[var(--muted-foreground)] sm:text-base sm:leading-8">
          Learn how to send and receive data with Rukny APIs, and how to
          implement the products and SDKs that fit your application.
        </p>
      </header>

      <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED.map((item) => (
          <FeaturedCard key={item.title} {...item} />
        ))}
      </section>

      <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-14">
        {SECTIONS.map((section) => (
          <DocsSection key={section.title} section={section} />
        ))}
      </div>
    </main>
  );
}
