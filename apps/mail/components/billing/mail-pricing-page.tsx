"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** @deprecated Legacy per-workspace mail pricing — redirects to unified catalog. */
export function MailPricingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/pricing");
  }, [router]);

  return (
    <p className="py-12 text-center text-sm text-[var(--muted-foreground)]">
      Redirecting to pricing…
    </p>
  );
}
