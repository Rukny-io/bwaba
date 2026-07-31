import Link from "next/link";
import { getLocale, getMessages } from "@/lib/i18n";
import { NextIntlClientProvider } from "next-intl";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = (messages as { Common: Record<string, string> }).Common;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="size-7 text-muted-foreground" aria-hidden />
        </div>
        <h1 className="mt-4 text-xl font-medium text-foreground">{t.not_found_title}</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t.not_found_desc}</p>
        <Button className="mt-6" asChild>
          <Link href="/login">{t.back_home}</Link>
        </Button>
      </div>
    </NextIntlClientProvider>
  );
}
