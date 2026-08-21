import { MailChrome } from "@/components/layout/mail-chrome";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <MailChrome>{children}</MailChrome>;
}
