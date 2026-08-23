import { NextRequest, NextResponse } from "next/server";
import { isValidMailAppId } from "@/lib/mail-app-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || "http://localhost:3001";

const FORWARD_REQUEST_HEADERS = [
  "content-type",
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

type RouteCtx = { params: Promise<{ appId: string }> };

function backendUrl(appId: string, action: "session" | "unlock" | "lock") {
  return `${API_BACKEND_URL.replace(/\/$/, "")}/api/v1/mail/apps/${encodeURIComponent(appId)}/mailboxes/${action}`;
}

async function proxyMailboxSession(
  request: NextRequest,
  appId: string,
  action: "session" | "unlock" | "lock",
  method: string,
) {
  if (!isValidMailAppId(appId)) {
    return NextResponse.json({ message: "Invalid Mail app." }, { status: 400 });
  }

  const headers = new Headers();
  for (const key of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }

  const init: RequestInit = {
    method,
    headers,
    cache: "no-store",
  };
  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.text();
  }

  const apiRes = await fetch(backendUrl(appId, action), init);
  const resHeaders = new Headers();
  const ct = apiRes.headers.get("content-type");
  if (ct) resHeaders.set("content-type", ct);
  resHeaders.set("cache-control", "no-store");
  for (const cookie of apiRes.headers.getSetCookie()) {
    resHeaders.append("set-cookie", cookie);
  }

  const body = await apiRes.arrayBuffer();
  return new NextResponse(body, { status: apiRes.status, headers: resHeaders });
}

export async function GET(request: NextRequest, ctx: RouteCtx) {
  const { appId } = await ctx.params;
  return proxyMailboxSession(request, appId, "session", "GET");
}

export async function POST(request: NextRequest, ctx: RouteCtx) {
  const { appId } = await ctx.params;
  return proxyMailboxSession(request, appId, "unlock", "POST");
}

export async function DELETE(request: NextRequest, ctx: RouteCtx) {
  const { appId } = await ctx.params;
  return proxyMailboxSession(request, appId, "lock", "POST");
}
