import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Mail,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react';
import {
  DOCUMENTATION_PRODUCTS,
  type DocumentationProductId,
} from '@/lib/documentation-nav';
import { cn } from '@/lib/utils';

const PRODUCT_ICONS: Record<DocumentationProductId, LucideIcon> = {
  'email-api': Mail,
  forms: ClipboardList,
  'whatsapp-api': MessageCircle,
};

export default function DocumentationHubPage() {
  return (
    <main className="mx-auto w-full max-w-[960px] px-4 py-14 sm:px-6 sm:py-20">
      <div className="max-w-2xl">
        <p className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--muted-foreground)]">
          <BookOpen className="size-3.5" />
          Documentation
        </p>
        <h1 className="mt-3 text-[2.25rem] font-semibold tracking-tight sm:text-5xl sm:leading-[1.1]">
          Build with Rukny
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted-foreground)] sm:text-[17px] sm:leading-8">
          Guides for Email API, Forms embeds, and more — practical paths from
          the developer portal to production.
        </p>
      </div>

      <section className="mt-14">
        <h2 className="text-[13px] font-medium text-[var(--muted-foreground)]">
          Products
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {DOCUMENTATION_PRODUCTS.map((product) => {
            const Icon = PRODUCT_ICONS[product.id];
            const card = (
              <article
                className={cn(
                  'group h-full rounded-2xl bg-[var(--surface-secondary)] p-5 transition-colors',
                  product.available &&
                    'hover:bg-[color-mix(in_srgb,var(--surface-secondary)_82%,var(--foreground)_6%)]',
                  !product.available && 'opacity-65',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--surface)]">
                    <Icon className="size-4 text-[var(--foreground)]" />
                  </div>
                  {product.available ? (
                    <ArrowRight className="size-4 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5" />
                  ) : (
                    <span className="text-[12px] text-[var(--muted-foreground)]">
                      Coming soon
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">
                  {product.title}
                </h3>
                <p className="mt-2 text-[13px] leading-6 text-[var(--muted-foreground)]">
                  {product.description}
                </p>
              </article>
            );

            return product.available ? (
              <Link key={product.id} href={product.href} className="block">
                {card}
              </Link>
            ) : (
              <div key={product.id}>{card}</div>
            );
          })}
        </div>
      </section>

      <section className="mt-12 grid gap-3 sm:grid-cols-2">
        <Link
          href="/login?next=/apps"
          className="rounded-2xl bg-[var(--surface-secondary)] p-5 transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_82%,var(--foreground)_6%)]"
        >
          <h3 className="text-[15px] font-semibold">Developer dashboard</h3>
          <p className="mt-2 text-[13px] leading-6 text-[var(--muted-foreground)]">
            Create apps, install products, manage keys, and use Try it.
          </p>
        </Link>
        <Link
          href="/documentation/forms/get-started"
          className="rounded-2xl bg-[var(--surface-secondary)] p-5 transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_82%,var(--foreground)_6%)]"
        >
          <h3 className="text-[15px] font-semibold">Embed a form</h3>
          <p className="mt-2 text-[13px] leading-6 text-[var(--muted-foreground)]">
            Link a form, set your website domain, and paste the iframe snippet.
          </p>
        </Link>
      </section>
    </main>
  );
}
