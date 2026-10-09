import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocFeatureGrid,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
} from '@/components/documentation/docs-article';
import { emailQuotasCopy } from '@/lib/documentation-content/email-api/final-pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

const PLAN_ROWS_EN = [
  ['Free', '3,000 / month', '0', '100 emails / day cap · 3 domains'],
  ['Pro 10K', '10,000 / month', '5,000', 'Self-serve request'],
  ['Pro 50K', '50,000 / month', '16,000', ''],
  ['Pro 100K', '100,000 / month', '28,000', ''],
  ['Scale 100K', '100,000 / month', '72,000', ''],
  ['Scale 200K', '200,000 / month', '125,000', ''],
  ['Scale 500K', '500,000 / month', '275,000', ''],
  ['Scale 1M', '1,000,000 / month', '500,000', ''],
  ['Scale 1.5M', '1,500,000 / month', '660,000', ''],
  ['Scale 2.5M', '2,500,000 / month', '920,000', ''],
];

const PLAN_ROWS_AR = [
  ['مجاني', '3,000 / شهر', '0', 'حد 100 رسالة/يوم · 3 نطاقات'],
  ['Pro 10K', '10,000 / شهر', '5,000', 'طلب ذاتي'],
  ['Pro 50K', '50,000 / شهر', '16,000', ''],
  ['Pro 100K', '100,000 / شهر', '28,000', ''],
  ['Scale 100K', '100,000 / شهر', '72,000', ''],
  ['Scale 200K', '200,000 / شهر', '125,000', ''],
  ['Scale 500K', '500,000 / شهر', '275,000', ''],
  ['Scale 1M', '1,000,000 / شهر', '500,000', ''],
  ['Scale 1.5M', '1,500,000 / شهر', '660,000', ''],
  ['Scale 2.5M', '2,500,000 / شهر', '920,000', ''],
];

const MARKETING_EN = [
  ['Marketing contacts', '1,000 contacts', '35,000 IQD / mo (5K contacts)'],
  ['Automations', '10,000 runs / month', '2 IQD / run overage'],
  ['Add-on: +100 domains', '—', '20,000 IQD / mo'],
  ['Add-on: Dedicated IP', '—', '30,000 IQD / mo'],
  ['Add-on: SSO', '—', '120,000 IQD / mo'],
];

const MARKETING_AR = [
  ['جهات تسويق', '1,000 جهة', '35,000 IQD / شهر (5 آلاف جهة)'],
  ['أتمتة', '10,000 تشغيل / شهر', '2 IQD / تشغيل تجاوز'],
  ['إضافة: +100 نطاق', '—', '20,000 IQD / شهر'],
  ['إضافة: IP مخصص', '—', '30,000 IQD / شهر'],
  ['إضافة: SSO', '—', '120,000 IQD / شهر'],
];

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), emailQuotasCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function EmailApiQuotasPage() {
  const locale = await getCurrentLocale();
  const c = docCopy(locale, emailQuotasCopy);
  const planRows = locale === 'ar' ? PLAN_ROWS_AR : PLAN_ROWS_EN;
  const marketingRows = locale === 'ar' ? MARKETING_AR : MARKETING_EN;

  return (
    <DocumentationArticle
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="plans" title={c.toc[0]!.label}>
        <DocTable headers={[...c.planHeaders]} rows={planRows} />
        <p>
          {c.plansIntroBefore}{' '}
          <a
            href="https://mail.rukny.io/pricing"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            mail.rukny.io/pricing
          </a>{' '}
          {c.plansIntroMid}{' '}
          <Link
            href="/pricing/compare-resend"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            /pricing/compare-resend
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="overage" title={c.toc[1]!.label}>
        <p>{c.overageBody}</p>
      </DocSection>

      <DocSection id="marketing" title={c.toc[2]!.label}>
        <DocTable headers={[...c.marketingHeaders]} rows={marketingRows} />
      </DocSection>

      <DocSection id="mvp" title={c.toc[3]!.label}>
        <DocFeatureGrid items={c.mvp} />
      </DocSection>

      <DocSection id="exceeded" title={c.toc[4]!.label}>
        <p>
          {c.exceededBody.includes('402 Payment Required') ? (
            <>
              {c.exceededBody.split('402 Payment Required')[0]}
              <DocInlineCode>402 Payment Required</DocInlineCode>
              {c.exceededBody.split('402 Payment Required')[1]?.split('quota_exceeded')[0]}
              <DocInlineCode>quota_exceeded</DocInlineCode>
              {c.exceededBody.split('quota_exceeded')[1]}
            </>
          ) : (
            c.exceededBody
          )}
        </p>
        <DocCallout>
          {c.exceededCallout.includes('429') ? (
            <>
              {c.exceededCallout.split('429')[0]}
              <DocInlineCode>429</DocInlineCode>
              {c.exceededCallout.split('429')[1]}
            </>
          ) : (
            c.exceededCallout
          )}
        </DocCallout>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/email-api/testing', label: c.prevLabel }}
        next={{ href: '/documentation/email-api/errors', label: c.nextLabel }}
      />
    </DocumentationArticle>
  );
}
