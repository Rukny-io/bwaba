import { redirect } from 'next/navigation';

export default function LegacySmtpDocsRedirect() {
  redirect('/documentation/email-api/send/smtp');
}
