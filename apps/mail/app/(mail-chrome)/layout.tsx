import { MailChrome } from "@/components/layout/mail-chrome";

/**
 * Always mount product chrome for console routes.
 * Do not gate on ready/shell cookies — those flip during domain restore/clear
 * and caused the sidebar + header to vanish until a full reload.
 */
export default function MailChromeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MailChrome layout="page">{children}</MailChrome>;
}
