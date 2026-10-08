import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || "http://localhost:3001";

const FORWARD_REQUEST_HEADERS = [
  "accept",
  "cookie",
  "origin",
  "referer",
  "user-agent",
  "x-forwarded-for",
  "x-real-ip",
  "x-forwarded-proto",
  "x-request-id",
  "x-csrf-token",
  "x-client-fingerprint",
  "accept-language",
];

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

/** Proxies link consumption so the mailbox session Set-Cookie lands on the Mail origin. */
export async function POST(request: NextRequest) {
  let token = "";
  let confirm = false;
  try {
    const body = (await request.json()) as { token?: unknown; confirm?: unknown };
    token = typeof body.token === "string" ? body.token.trim() : "";
    confirm = body.confirm === true;
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json(
      { message: "This sign-in link is not valid." },
      { status: 400 },
    );
  }

  const headers = new Headers({ "content-type": "application/json" });
  for (const key of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }

  const apiRes = await fetch(
    `${API_BACKEND_URL.replace(/\/$/, "")}/api/v1/mail/sso/links/${encodeURIComponent(token)}/consume`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ confirm }),
      cache: "no-store",
    },
  );

  const resHeaders = new Headers();
  const ct = apiRes.headers.get("content-type");
  if (ct) resHeaders.set("content-type", ct);
  resHeaders.set("cache-control", "no-store");
  for (const cookie of apiRes.headers.getSetCookie()) {
    resHeaders.append("set-cookie", cookie);
  }
  return new NextResponse(await apiRes.arrayBuffer(), {
    status: apiRes.status,
    headers: resHeaders,
  });
}
