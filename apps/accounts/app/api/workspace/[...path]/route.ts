import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

const ALLOWED_PREFIXES = ["quota", "members", "invitations", "accessible"];

type RouteCtx = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxyToBackend(request, path, {
    apiPrefix: "workspace",
    allowedPrefixes: ALLOWED_PREFIXES,
  });
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
