import Link from "next/link";
import Image from "next/image";

export function MailMarketingFooter({ signedIn }: { signedIn: boolean }) {
  return (
    <footer className="border-t border-[#E8ECF0] bg-transparent px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 sm:mb-12">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <Image src="/rukny-logo.svg" alt="" width={28} height={28} />
            <span className="text-2xl font-bold tracking-tight text-[#132327]">
              Rukny
            </span>
          </Link>
          <p className="max-w-2xl text-sm leading-relaxed text-[#132327]/55">
            Rukny Mail is business email on a domain you own — mailboxes,
            routing, and webmail in one console.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#132327]">Product</h3>
            <ul className="space-y-3 text-sm text-[#132327]/55">
              <li>
                <Link href="/" className="hover:text-[#062c30]">
                  Overview
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#062c30]">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/getting-started" className="hover:text-[#062c30]">
                  Getting started
                </Link>
              </li>
              <li>
                <Link href="/tutorials" className="hover:text-[#062c30]">
                  Tutorials
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="hover:text-[#062c30]">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#132327]">Console</h3>
            <ul className="space-y-3 text-sm text-[#132327]/55">
              <li>
                <Link
                  href={signedIn ? "/apps" : "/login"}
                  className="hover:text-[#062c30]"
                >
                  {signedIn ? "Open console" : "Sign in"}
                </Link>
              </li>
              <li>
                <Link
                  href={signedIn ? "/pricing" : "/login?next=/pricing"}
                  className="hover:text-[#062c30]"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#132327]">Legal</h3>
            <ul className="space-y-3 text-sm text-[#132327]/55">
              <li>
                <Link href="/privacy" className="hover:text-[#062c30]">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#062c30]">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#132327]">Rukny</h3>
            <ul className="space-y-3 text-sm text-[#132327]/55">
              <li>
                <a href="mailto:support@rukny.io" className="hover:text-[#062c30]">
                  support@rukny.io
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[#E8ECF0] pt-6 text-xs text-[#132327]/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Rukny. All rights reserved.</p>
          <p>Rukny Mail</p>
        </div>
      </div>
    </footer>
  );
}
