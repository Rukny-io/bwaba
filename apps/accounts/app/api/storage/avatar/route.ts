import { NextRequest, NextResponse } from "next/server";
import {
  API_BACKEND_URL,
  buildProxyRequestHeaders,
  buildProxyResponseHeaders,
} from "@/lib/api-proxy";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
  }

  const backendForm = new FormData();
  backendForm.append("file", file);

  const headers = buildProxyRequestHeaders(request);

  const apiRes = await fetch(`${API_BACKEND_URL}/api/v1/storage/avatar`, {
    method: "POST",
    headers,
    body: backendForm,
  });

  const resHeaders = buildProxyResponseHeaders(apiRes);
  const body = await apiRes.arrayBuffer();
  return new NextResponse(body, { status: apiRes.status, headers: resHeaders });
}
