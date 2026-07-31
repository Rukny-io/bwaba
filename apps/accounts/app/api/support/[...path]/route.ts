import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteCtx = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  const first = path[0]?.toLowerCase();

  if (!first || !UUID_RE.test(first)) {
    return new NextResponse(JSON.stringify({ error: "Invalid path" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  return proxyToBackend(request, path, {
    apiPrefix: "support-tickets",
    allowedPrefixes: [first],
  });
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
