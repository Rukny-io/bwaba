import { NextRequest, NextResponse } from "next/server";
import { API_BACKEND_URL } from "@/lib/api-proxy";

const FORWARD_HEADERS = [
  "cookie",
  "origin",
  "referer",
  "user-agent",
  "x-forwarded-for",
  "x-real-ip",
  "x-csrf-token",
];

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
  }

  const backendForm = new FormData();
  backendForm.append("file", file);

  const headers = new Headers();
  for (const key of FORWARD_HEADERS) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }

  const apiRes = await fetch(`${API_BACKEND_URL}/api/v1/storage/avatar`, {
    method: "POST",
    headers,
    body: backendForm,
  });

  const resHeaders = new Headers();
  const ct = apiRes.headers.get("content-type");
  if (ct) resHeaders.set("content-type", ct);

  for (const cookie of apiRes.headers.getSetCookie()) {
    resHeaders.append("set-cookie", cookie);
  }

  const body = await apiRes.arrayBuffer();
  return new NextResponse(body, { status: apiRes.status, headers: resHeaders });
}
