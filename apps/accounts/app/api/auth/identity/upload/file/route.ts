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

function isUploadBlob(value: FormDataEntryValue | null): value is File {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as Blob).arrayBuffer === "function" &&
    typeof (value as File).size === "number" &&
    (value as File).size > 0
  );
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const sessionId = formData.get("sessionId");
  const slot = formData.get("slot");

  if (!isUploadBlob(file)) {
    return NextResponse.json({ message: "الملف مطلوب" }, { status: 400 });
  }
  if (typeof sessionId !== "string" || !sessionId.trim()) {
    return NextResponse.json({ message: "جلسة الرفع مطلوبة" }, { status: 400 });
  }
  if (typeof slot !== "string" || !slot.trim()) {
    return NextResponse.json({ message: "نوع الملف غير صالح" }, { status: 400 });
  }

  const backendForm = new FormData();
  backendForm.append("sessionId", sessionId.trim());
  backendForm.append("slot", slot.trim());
  const fileName =
    file instanceof File && file.name ? file.name : "identity-document.jpg";
  backendForm.append("file", file, fileName);

  const headers = new Headers();
  for (const key of FORWARD_HEADERS) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }

  const apiRes = await fetch(
    `${API_BACKEND_URL}/api/v1/auth/identity/upload/file`,
    {
      method: "POST",
      headers,
      body: backendForm,
    },
  );

  const resHeaders = new Headers();
  const ct = apiRes.headers.get("content-type");
  if (ct) resHeaders.set("content-type", ct);

  for (const cookie of apiRes.headers.getSetCookie()) {
    resHeaders.append("set-cookie", cookie);
  }

  const body = await apiRes.arrayBuffer();
  return new NextResponse(body, { status: apiRes.status, headers: resHeaders });
}
