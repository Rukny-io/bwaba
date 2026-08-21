import { MailChrome } from "@/components/layout/mail-chrome";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MailChrome layout="page">{children}</MailChrome>;
}
