import { siteUrls } from '@/lib/site-urls';

const TEXT = '#132327';
const MUTED = 'rgba(19, 35, 39, 0.55)';
const BORDER = '#E8ECF0';

export function AppPurposeSection() {
  return (
    <section
      id="about"
      className="border-t bg-white px-4 py-14 sm:px-6 sm:py-16 md:py-20"
      style={{ borderColor: BORDER }}
      aria-labelledby="app-purpose-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14" dir="ltr">
          <div>
            <p className="mb-2 text-[13px] font-medium" style={{ color: MUTED }}>
              About Rukny Solutions
            </p>
            <h2
              id="app-purpose-heading"
              className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl"
              style={{ color: TEXT }}
            >
              Rukny Solutions — one platform for your online business
            </h2>
            <div
              className="mt-5 space-y-4 text-[15px] leading-[1.8]"
              style={{ color: MUTED }}
            >
              <p>
                <strong style={{ color: TEXT }}>Rukny Solutions</strong> (ركني)
                is an Arabic-first SaaS platform that helps creators, small
                businesses, and teams launch and run their digital presence from
                a single dashboard.
              </p>
              <p>
                With Rukny you can publish an online store, build smart forms,
                share a professional profile page, manage links, and view
                analytics — without hiring a development team.
              </p>
              <p>
                Users sign in at{' '}
                <a href={siteUrls.accounts} className="underline hover:opacity-80">
                  accounts.rukny.io
                </a>
                , manage their workspace at{' '}
                <a href={siteUrls.app} className="underline hover:opacity-80">
                  app.rukny.io
                </a>
                , and publish forms at{' '}
                <a href={siteUrls.forms} className="underline hover:opacity-80">
                  forms.rukny.io
                </a>
                .
              </p>
            </div>
          </div>

          <div
            className="rounded-2xl border p-6 sm:p-7"
            style={{ borderColor: BORDER, backgroundColor: '#FAFBFC' }}
          >
            <h3
              className="text-lg font-semibold"
              style={{ color: TEXT }}
            >
              Google integrations (OAuth)
            </h3>
            <p
              className="mt-3 text-[14px] leading-[1.75]"
              style={{ color: MUTED }}
            >
              When a user connects Google, Rukny Solutions requests access only
              to support features they explicitly enable:
            </p>
            <ul
              className="mt-4 space-y-3 text-[14px] leading-[1.7]"
              style={{ color: MUTED }}
            >
              <li>
                <strong style={{ color: TEXT }}>Google Sheets</strong> — sync
                form submissions to spreadsheets the user selects.
              </li>
              <li>
                <strong style={{ color: TEXT }}>Google Drive (app data)</strong>
                — store the user&apos;s integration settings securely in their
                own Drive, tied to their account.
              </li>
            </ul>
            <p
              className="mt-4 text-[13px] leading-[1.7]"
              style={{ color: MUTED }}
            >
              We do not sell user data. See our{' '}
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
      </div>
    </section>
  );
}
