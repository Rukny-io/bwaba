import type { Metadata } from "next";
import { HeroSection } from "@/components/shared/hero-section-1";

export const metadata: Metadata = {
  title: "ركني — منصة واحدة لكل ما تحتاجه",
  description:
    "أطلق مشروعك الرقمي من مكان واحد: متجر، نماذج، ملف شخصي، وتحليلات ذكية.",
};

export default function Home() {
  return <HeroSection />;
}
