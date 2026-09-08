import { NextRequest, NextResponse } from "next/server";
import { isValidMailAppId } from "@/lib/mail-app-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || "http://localhost:3001";

const FORWARD_REQUEST_HEADERS = [
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
  "accept",
] as const;

type RouteCtx = { params: Promise<{ appId: string }> };

/**
 * Dedicated multipart proxy for BIMI logo uploads.
 * Next rewrites can drop or empty file parts; forwarding the raw body preserves
 * the multipart boundary and binary payload for Nest/multer.
 */
export async function POST(request: NextRequest, ctx: RouteCtx) {
  const { appId } = await ctx.params;
  if (!isValidMailAppId(appId)) {
    return NextResponse.json({ message: "Invalid workspace." }, { status: 400 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return NextResponse.json(
      { message: "Expected multipart form upload." },
      { status: 400 },
    );
  }

  const headers = new Headers();
  for (const key of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  headers.set("content-type", contentType);

  const body = await request.arrayBuffer();
  if (!body.byteLength) {
    return NextResponse.json(
      { message: "No logo file was received. Try again." },
      { status: 400 },
    );
  }

  const apiRes = await fetch(
    `${API_BACKEND_URL.replace(/\/$/, "")}/api/v1/mail/apps/${encodeURIComponent(appId)}/domain-verification/bimi/logo`,
    {
      method: "POST",
      headers,
      body,
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
