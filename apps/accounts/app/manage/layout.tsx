import type { Metadata } from "next";
import { getLocale, getMessages } from "@/lib/i18n";
import { ManageRoot } from "@/components/manage/manage-root";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const manage = (messages as { Manage: { title: string; hub: { description: string } } }).Manage;

  return {
    title: `${manage.title} — Rukny`,
    description: manage.hub.description,
  };
}

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return <ManageRoot>{children}</ManageRoot>;
}
