import { MailChrome } from "@/components/layout/mail-chrome";

/** Scrollable chrome for settings-style tools (domain, mailboxes, DNS helpers, etc.). */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <MailChrome layout="page">{children}</MailChrome>;
}
