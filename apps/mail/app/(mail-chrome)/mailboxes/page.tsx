import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { mailSlotPath } from "@/lib/mail-slot";

/** Old /mailboxes URL — overview now lives at /app. */
export default async function MailboxesPage() {
  const slotHeader = (await headers()).get("x-mail-slot");
  const slot = slotHeader ? Number(slotHeader) : NaN;
  redirect(Number.isInteger(slot) ? mailSlotPath(slot, "/app") : "/app");
}
