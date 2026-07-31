"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-7 text-destructive" aria-hidden />
      </div>
      <h1 className="mt-4 text-xl font-medium text-foreground">{t("error_title")}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t("error_desc")}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={reset}>
          {t("try_again")}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">{t("back_home")}</Link>
        </Button>
      </div>
    </div>
  );
}
