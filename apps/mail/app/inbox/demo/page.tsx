import { notFound } from "next/navigation";
import { MailInboxShell } from "@/components/inbox/mail-inbox-shell";

export default function DemoInboxPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <MailInboxShell demo />;
}
