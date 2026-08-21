import { cookies } from "next/headers";
import { MailChrome } from "@/components/layout/mail-chrome";
import { MAIL_READY_COOKIE } from "@/lib/ses";

export default async function AppPageLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const ready = cookieStore.get(MAIL_READY_COOKIE)?.value === "1";

  if (!ready) return children;

  return <MailChrome layout="page">{children}</MailChrome>;
}
