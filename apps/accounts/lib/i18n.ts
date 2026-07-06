import { cookies } from "next/headers";
import ar from "../messages/ar.json";
import en from "../messages/en.json";

export async function getLocale() {
  const cookieStore = await cookies();
  return cookieStore.get("NEXT_LOCALE")?.value || "ar";
}

export async function getMessages(locale: string) {
  if (locale === "en") return en;
  return ar;
}
