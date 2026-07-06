import type { Metadata } from "next";
import { ManageRoot } from "@/components/manage/manage-root";

export const metadata: Metadata = {
  title: "إدارة الحساب — Rukny",
  description: "إدارة حسابك الشخصي على منصة ركني",
};

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return <ManageRoot>{children}</ManageRoot>;
}
