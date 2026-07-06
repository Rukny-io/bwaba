import Link from 'next/link';
import { ArrowLeft, Code2, MessageCircle, Webhook } from 'lucide-react';
import { LandingFooter, LandingHeader } from '@/components/landing/landing-shell';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <LandingHeader />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-16">
        <section className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-xs font-medium text-[var(--primary)]">
              WhatsApp API Platform
            </p>
            <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              أرسل رسائل WhatsApp عبر API بسيط وآمن
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
              اربط حساب WhatsApp Business، أنشئ مفاتيح API، وأرسل رسائل
              برمجياً — مع محفظة IQD وWebhooks وتوثيق تفاعلي.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <Link
                href="/login?next=/apps"
                className="touch-target inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 sm:w-auto"
              >
                ابدأ مجاناً
                <ArrowLeft className="size-4" />
              </Link>
              <Link
                href="/app/docs"
                className="touch-target inline-flex h-11 w-full items-center justify-center rounded-full border border-[var(--border)] px-6 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] sm:w-auto"
              >
                التوثيق
              </Link>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl p-4 sm:rounded-3xl sm:p-6">
            <pre className="overflow-x-auto rounded-2xl bg-[var(--surface-secondary)] p-3 text-[11px] leading-relaxed text-[var(--foreground)] sm:p-4 sm:text-sm">
              <code dir="ltr">{`curl -X POST https://api.rukny.io/v1/whatsapp/messages \\
  -H "X-API-Key: rk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+9647xxxxxxxxx",
    "type": "text",
    "text": { "body": "مرحباً من Rukny!" }
  }'`}</code>
            </pre>
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: MessageCircle,
              title: 'WhatsApp Business',
              desc: 'ربط WABA عبر Embedded Signup وإرسال رسائل فوراً.',
            },
            {
              icon: Code2,
              title: 'REST API',
              desc: 'مفاتيح API مع صلاحيات دقيقة ومعدل طلبات مرن.',
            },
            {
              icon: Webhook,
              title: 'Webhooks',
              desc: 'استقبل أحداث التسليم والقراءة والرسائل الواردة.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <article key={title} className="dashboard-card rounded-2xl p-5">
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)]">
                <Icon className="size-5" />
              </div>
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {desc}
              </p>
            </article>
          ))}
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
