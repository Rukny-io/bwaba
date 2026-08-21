import { cookies } from "next/headers";
import { MailChrome } from "@/components/layout/mail-chrome";
import { MAIL_READY_COOKIE, MAIL_SHELL_COOKIE } from "@/lib/ses";

export default async function AppPageLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const ready = cookieStore.get(MAIL_READY_COOKIE)?.value === "1";
  const shell = cookieStore.get(MAIL_SHELL_COOKIE)?.value === "1";

  // Shell: sidebar + top nav after domain is connected/skipped.
  // Ready: full DNS verified (also unlocks domain-gated tools in proxy).
  if (!ready && !shell) return children;

  return <MailChrome layout="page">{children}</MailChrome>;
}
