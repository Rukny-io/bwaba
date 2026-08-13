import type { Metadata } from "next";
import { HeroSection } from "@/components/shared/hero-section-1";

export const metadata: Metadata = {
  title: "Rukny Solutions — منصة واحدة لكل ما تحتاجه",
  description:
    "Rukny Solutions (ركني) is an Arabic SaaS platform for online stores, smart forms, profiles, and analytics. Sync form data to Google Sheets when users connect Google.",
};

export default function Home() {
  return <HeroSection />;
}
