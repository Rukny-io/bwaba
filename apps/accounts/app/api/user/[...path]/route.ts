import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

const ALLOWED_PREFIXES = [
  "profile",
  "sessions",
  "security-logs",
  "security-stats",
  "2fa",
  "account",
];

type RouteCtx = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxyToBackend(request, path, {
    apiPrefix: "user",
    allowedPrefixes: ALLOWED_PREFIXES,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
