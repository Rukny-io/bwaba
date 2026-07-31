import { NextRequest, NextResponse } from "next/server";
import {
  API_BACKEND_URL,
  buildProxyRequestHeaders,
  buildProxyResponseHeaders,
} from "@/lib/api-proxy";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await ctx.params;

  if (!UUID_RE.test(ticketId)) {
    return NextResponse.json({ message: "Invalid ticket id" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
  }

  const backendForm = new FormData();
  backendForm.append("file", file);

  const headers = buildProxyRequestHeaders(request);

  const messageId = request.nextUrl.searchParams.get("messageId");
  const qs = messageId ? `?messageId=${encodeURIComponent(messageId)}` : "";

  const apiRes = await fetch(
    `${API_BACKEND_URL}/api/v1/support-tickets/${ticketId}/attachments${qs}`,
    {
      method: "POST",
      headers,
      body: backendForm,
    },
  );

  const resHeaders = buildProxyResponseHeaders(apiRes);
  const body = await apiRes.arrayBuffer();
  return new NextResponse(body, { status: apiRes.status, headers: resHeaders });
}
