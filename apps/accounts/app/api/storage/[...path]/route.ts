import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

const ALLOWED_PREFIXES = ["direct-upload"];

type RouteCtx = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxyToBackend(request, path, {
    apiPrefix: "storage",
    allowedPrefixes: ALLOWED_PREFIXES,
  });
}

export const GET = handle;
export const POST = handle;
