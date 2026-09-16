import {
  AtSign,
  BookOpen,
  CreditCard,
  Inbox,
  LifeBuoy,
  Route,
  Shield,
  type LucideIcon,
} from "lucide-react";
import type { MailTutorialCategoryId } from "@/lib/mail-tutorials";

export const MAIL_DOC_CATEGORY_ICONS: Record<MailTutorialCategoryId, LucideIcon> = {
  setup: BookOpen,
  mailboxes: Inbox,
  routing: Route,
  deliverability: AtSign,
  security: Shield,
  troubleshooting: LifeBuoy,
  billing: CreditCard,
};
