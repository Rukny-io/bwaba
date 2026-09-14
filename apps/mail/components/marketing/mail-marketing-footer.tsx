import Link from "next/link";
import Image from "next/image";

export function MailMarketingFooter({ signedIn }: { signedIn: boolean }) {
  return (
    <footer className="border-t border-[#e7e5e4] bg-[#fbfbfc] px-4 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 sm:mb-12">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <Image src="/rukny-logo.svg" alt="" width={28} height={28} />
            <span className="text-2xl font-bold tracking-tight text-[#1c1917]">
              Rukny
            </span>
          </Link>
          <p className="max-w-2xl text-sm leading-relaxed text-[#57534e]">
            Rukny Mail is business email on a domain you own — mailboxes,
            routing, and webmail in one console.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 border-t border-[#e7e5e4] pt-8 sm:grid-cols-4">
          <div>
            <h3 className="mb-4 text-xs font-medium uppercase tracking-[1.2px] text-[#1c1917]">
              Product
            </h3>
            <ul className="space-y-3 text-sm text-[#57534e]">
              <li>
                <Link href="/" className="transition-colors hover:text-[#1c1917]">
                  Overview
                </Link>
              </li>
              <li>
                <Link href="/#features" className="transition-colors hover:text-[#1c1917]">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/getting-started" className="transition-colors hover:text-[#1c1917]">
                  Getting started
                </Link>
              </li>
              <li>
                <Link href="/tutorials" className="transition-colors hover:text-[#1c1917]">
                  Tutorials
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="transition-colors hover:text-[#1c1917]">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-medium uppercase tracking-[1.2px] text-[#1c1917]">
              Console
            </h3>
            <ul className="space-y-3 text-sm text-[#57534e]">
              <li>
                <Link
                  href={signedIn ? "/apps" : "/login"}
                  className="transition-colors hover:text-[#1c1917]"
                >
                  {signedIn ? "Open console" : "Sign in"}
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="transition-colors hover:text-[#1c1917]"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-medium uppercase tracking-[1.2px] text-[#1c1917]">
              Legal
            </h3>
            <ul className="space-y-3 text-sm text-[#57534e]">
              <li>
                <Link href="/privacy" className="transition-colors hover:text-[#1c1917]">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-[#1c1917]">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-medium uppercase tracking-[1.2px] text-[#1c1917]">
              Rukny
            </h3>
            <ul className="space-y-3 text-sm text-[#57534e]">
              <li>
                <a
                  href="mailto:support@rukny.io"
                  className="transition-colors hover:text-[#1c1917]"
                >
                  support@rukny.io
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[#e7e5e4] pt-6 text-xs text-[#a8a29e] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Rukny. All rights reserved.</p>
          <p>Rukny Mail</p>
        </div>
      </div>
    </footer>
  );
}
