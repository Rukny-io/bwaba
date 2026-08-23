import { siteUrls } from '@/lib/site-urls';

/**
 * Server-rendered for Google OAuth homepage verification.
 * App name must match OAuth consent screen: "Rukny".
 */
export function HomeAppSummary() {
  return (
    <section
      id="app-summary"
      dir="ltr"
      className="border-b border-[#E8ECF0] bg-[#FAFBFC] px-4 pb-5 pt-14 sm:px-6 sm:pb-6 sm:pt-[4.25rem]"
      aria-labelledby="what-is-rukny"
    >
      <div className="mx-auto max-w-6xl space-y-4 text-[13px] leading-[1.8] text-[#132327]/75 sm:text-[14px]">
        <div>
          <h2
            id="what-is-rukny"
            className="text-base font-bold text-[#132327] sm:text-lg"
          >
            What is Rukny?
          </h2>
          <p className="mt-2">
            <strong className="font-semibold text-[#132327]">Rukny</strong> (ركني)
            is an Arabic SaaS application that helps creators and businesses launch
            and manage their digital presence from one place. With Rukny you can:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Publish an online store and sell products</li>
            <li>Build and publish smart forms and collect responses</li>
            <li>Create a professional profile page and manage links</li>
            <li>View analytics for visits, sales, and form submissions</li>
          </ul>
          <p className="mt-2">
            Users sign in at{' '}
            <a href={siteUrls.accounts} className="underline hover:opacity-80">
              accounts.rukny.io
            </a>
            , publish forms at{' '}
            <a href={siteUrls.forms} className="underline hover:opacity-80">
              forms.rukny.io
            </a>
            , and use mail at{' '}
            <a href={siteUrls.mail} className="underline hover:opacity-80">
              mail.rukny.io
            </a>
            .
          </p>
        </div>

        <div>
          <h2
            id="google-data-use"
            className="text-base font-bold text-[#132327] sm:text-lg"
          >
            How Rukny uses Google user data
          </h2>
          <p className="mt-2">
            Rukny requests Google access <strong>only after</strong> a user chooses
            to connect Google. We use it to:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              Sync form submissions to Google Sheets the user selects
            </li>
            <li>
              Store the user&apos;s integration settings in their own Google Drive
              (app configuration data)
            </li>
          </ul>
          <p className="mt-2">
            We do not sell personal data. Read our{' '}
            <a href={siteUrls.privacy} className="underline hover:opacity-80">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href={siteUrls.terms} className="underline hover:opacity-80">
              Terms of Service
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
