import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

async function handle(request: NextRequest) {
  return proxyToBackend(request, ["me"], {
    apiPrefix: "support-tickets",
    allowedPrefixes: ["me"],
  });
}

export const GET = handle;
export const POST = handle;
