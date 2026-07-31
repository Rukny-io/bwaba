import { NextRequest, NextResponse } from "next/server";
import {
  API_BACKEND_URL,
  buildProxyRequestHeaders,
  buildProxyResponseHeaders,
} from "@/lib/api-proxy";

export async function POST(request: NextRequest) {
  const headers = buildProxyRequestHeaders(request);

  const apiRes = await fetch(`${API_BACKEND_URL}/api/v1/profiles/phone/send-otp`, {
    method: "POST",
    headers,
    body: await request.text(),
  });

  const resHeaders = buildProxyResponseHeaders(apiRes);
  const body = await apiRes.arrayBuffer();
  return new NextResponse(body, { status: apiRes.status, headers: resHeaders });
}
