import { cache } from "react";
import { cookies, headers } from "next/headers";
import { resolveAvatarUrl } from "@/lib/media-url";

export type MailSessionUser = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};

const FORWARD_HEADERS = [
  "user-agent",
  "accept-language",
  "accept-encoding",
  "sec-ch-ua",
  "sec-ch-ua-platform",
  "sec-ch-ua-mobile",
  "x-client-fingerprint",
  "x-forwarded-for",
  "x-real-ip",
] as const;

async function fetchCurrentMailUser(): Promise<MailSessionUser | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((item) => `${item.name}=${item.value}`)
    .join("; ");

  if (!cookieHeader) return null;

  const incoming = await headers();
  const requestHeaders: Record<string, string> = { Cookie: cookieHeader };
  for (const name of FORWARD_HEADERS) {
    const value = incoming.get(name);
    if (value) requestHeaders[name] = value;
  }

  const backendUrl =
    process.env.API_BACKEND_URL ||
    process.env.API_URL ||
    "http://localhost:3001";

  try {
    const res = await fetch(`${backendUrl.replace(/\/$/, "")}/api/v1/auth/me`, {
      headers: requestHeaders,
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      user?: {
        id?: string;
        name?: string | null;
        username?: string | null;
        email?: string;
        avatar?: string | null;
      };
      id?: string;
      name?: string | null;
      username?: string | null;
      email?: string;
      avatar?: string | null;
    };
    const user = data.user ?? data;
    if (!user.id) return null;
    const name =
      user.name?.trim() ||
      user.username?.trim() ||
      user.email ||
      "";

    return {
      id: String(user.id),
      name,
      email: String(user.email ?? ""),
      avatar: resolveAvatarUrl(user.avatar) ?? null,
    };
  } catch {
    return null;
  }
}

export const getCurrentMailUser = cache(fetchCurrentMailUser);
