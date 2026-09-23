import {
  Cloud,
  Globe,
  Lock,
  Mail,
  Server,
  Shield,
  Send,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type LogoDef = {
  Icon: LucideIcon;
  name: string;
  color: string;
};

/** Default logo set — mail / infra themed (Lucide fallbacks). */
export const LOGOS: LogoDef[] = [
  { Icon: Cloud, name: "AWS", color: "#FF9900" },
  { Icon: Cloud, name: "Google Cloud", color: "#4285F4" },
  { Icon: Server, name: "Microsoft", color: "#00A4EF" },
  { Icon: Send, name: "Amazon SES", color: "#232F3E" },
  { Icon: Globe, name: "DNS", color: "#34A853" },
  { Icon: Shield, name: "SPF / DKIM", color: "#1D1D1D" },
  { Icon: Mail, name: "Mailboxes", color: "#EA4335" },
  { Icon: Lock, name: "Encryption", color: "#6B6F76" },
  { Icon: Zap, name: "Delivery", color: "#FBBC04" },
];
