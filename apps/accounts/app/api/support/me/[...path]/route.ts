import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

const ALLOWED_SUBPATHS = ["open-count"];

type RouteCtx = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  const sub = path[0]?.toLowerCase();

  if (!sub || !ALLOWED_SUBPATHS.includes(sub)) {
    return new NextResponse(JSON.stringify({ error: "Invalid path" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  return proxyToBackend(request, ["me", ...path], {
    apiPrefix: "support-tickets",
    allowedPrefixes: ["me"],
  });
}

export const GET = handle;
