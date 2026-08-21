import { cookies, headers } from "next/headers";

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || "http://localhost:3001";

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

export async function requireMailSession(): Promise<{ userId: string; email: string } | null> {
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

  try {
    const res = await fetch(`${API_BACKEND_URL.replace(/\/$/, "")}/api/v1/auth/me`, {
      headers: requestHeaders,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      user?: { id?: string; email?: string };
      id?: string;
      email?: string;
    };
    const user = data.user ?? data;
    if (!user.id) return null;
    return { userId: String(user.id), email: String(user.email ?? "") };
  } catch {
    return null;
  }
}

export async function apiFetchJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((item) => `${item.name}=${item.value}`)
    .join("; ");

  if (!cookieHeader) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const incoming = await headers();
  const requestHeaders = new Headers(init.headers);
  requestHeaders.set("Cookie", cookieHeader);
  if (!requestHeaders.has("Content-Type") && init.body) {
    requestHeaders.set("Content-Type", "application/json");
  }
  for (const name of FORWARD_HEADERS) {
    const value = incoming.get(name);
    if (value) requestHeaders.set(name, value);
  }

  try {
    const res = await fetch(`${API_BACKEND_URL.replace(/\/$/, "")}/api/v1${path}`, {
      ...init,
      headers: requestHeaders,
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as T & { message?: string | string[] };
    if (!res.ok) {
      const raw = data && typeof data === "object" ? data.message : undefined;
      const message = Array.isArray(raw) ? raw[0] : raw || "Request failed";
      return { ok: false, status: res.status, error: String(message) };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, status: 502, error: "API unavailable" };
  }
}
