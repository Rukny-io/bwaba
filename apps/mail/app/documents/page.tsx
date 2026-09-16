import type { Metadata } from "next";
import { MailDocumentsHubPage } from "@/components/documents/mail-documents-hub-page";

export const metadata: Metadata = {
  title: "Documents — Rukny Mail",
  description:
    "Guides for domain setup, mailboxes, routing, and delivery on Rukny Mail.",
};

export default function DocumentsHubPage() {
  return <MailDocumentsHubPage />;
}
