import { siteUrls } from '@/lib/site-urls';

/**
 * Server-rendered summary for OAuth homepage verification (Google crawlers).
 * Kept visible above the fold — see Google App Homepage requirements.
 */
export function HomeAppSummary() {
  return (
    <section
      id="app-summary"
      dir="ltr"
      className="border-b border-[#E8ECF0] bg-[#FAFBFC] px-4 pb-4 pt-14 sm:px-6 sm:pb-5 sm:pt-[4.25rem]"
      aria-label="About Rukny Solutions"
    >
      <div className="mx-auto max-w-6xl text-[13px] leading-[1.75] text-[#132327]/70 sm:text-[14px]">
        <p>
          <strong className="font-semibold text-[#132327]">Rukny Solutions</strong>{' '}
          is the official application name of our Arabic SaaS platform (ركني). We
          help businesses run online stores, smart forms, profile pages, links,
          and analytics from one dashboard — at{' '}
          <a href={siteUrls.app} className="underline hover:opacity-80">
            app.rukny.io
          </a>
          ,{' '}
          <a href={siteUrls.forms} className="underline hover:opacity-80">
            forms.rukny.io
          </a>
          , and{' '}
          <a href={siteUrls.accounts} className="underline hover:opacity-80">
            accounts.rukny.io
          </a>
          .
        </p>
        <p className="mt-2">
          <strong className="font-semibold text-[#132327]">Why we request Google user data:</strong>{' '}
          only when a user connects Google — to sync form submissions to Google
          Sheets they choose, and to store their integration configuration in
          their own Google Drive (including app configuration data). We do not
          sell personal data.{' '}
          <a href={siteUrls.privacy} className="underline hover:opacity-80">
            Privacy Policy
          </a>
          {' · '}
          <a href={siteUrls.terms} className="underline hover:opacity-80">
            Terms of Service
          </a>
        </p>
      </div>
    </section>
  );
}
