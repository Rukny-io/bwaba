import { sessionFetch } from "@/lib/api-client";
import type { MailBimiSetupStatus } from "@/lib/mail-domain";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_SVG_BYTES = 256 * 1024;
const LOGO_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg"];
const LOGO_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

async function parse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string | string[];
  };
  if (!response.ok) {
    const raw = data.message;
    throw new Error(Array.isArray(raw) ? raw[0] : raw || "Request failed");
  }
  return data;
}

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function getBimiSetupStatus(appId: string) {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/domain-verification/bimi`,
  );
  return parse<MailBimiSetupStatus>(response);
}

export async function uploadBimiLogo(appId: string, file: File) {
  if (!file.size) {
    throw new Error("Selected file is empty.");
  }
  const lowerName = file.name.toLowerCase();
  const isSupported =
    LOGO_EXTENSIONS.some((extension) => lowerName.endsWith(extension)) ||
    LOGO_MIME_TYPES.has(file.type);
  if (!isSupported) {
    throw new Error("Choose a PNG, JPG, WebP, or SVG logo.");
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("The logo must be 2MB or smaller.");
  }
  if (
    (lowerName.endsWith(".svg") || file.type === "image/svg+xml") &&
    file.size > MAX_SVG_BYTES
  ) {
    throw new Error("The source SVG must be 256KB or smaller.");
  }
  const contentBase64 = await fileToBase64(file);
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/domain-verification/bimi/logo`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentBase64,
        fileName: file.name || "logo.svg",
        mimeType: file.type || "application/octet-stream",
      }),
    },
  );
  return parse<MailBimiSetupStatus>(response);
}
