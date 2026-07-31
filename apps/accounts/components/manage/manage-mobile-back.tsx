"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManageMobileBackProps {
  href: string;
  label?: string;
}

export function ManageMobileBack({ href, label }: ManageMobileBackProps) {
  const locale = useLocale();
  const t = useTranslations("Manage");
  const isRtl = locale === "ar";

  return (
    <Link
      href={href}
      className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm text-primary lg:hidden"
    >
      <ChevronLeft className={cn("size-4", !isRtl && "rotate-180")} />
      {label ?? t("back")}
    </Link>
  );
}
