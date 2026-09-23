import { sessionFetch } from "@/lib/api-client";
import { isValidMailAppId, readMailAppIdFromDocument } from "@/lib/mail-app-id";
import { toApiMailPlan, type MailPlanId } from "@/lib/mail-plans";

export type MailCheckoutSessionResponse = {
  sessionId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
  plan: string;
  planName: string;
  mailboxCount: number;
  appId: string;
  appName: string;
  returnUrl: string;
  expiresIn: number;
};

async function readJson<T>(response: Response): Promise<T & { message?: string | string[]; error?: string }> {
  return (await response.json().catch(() => ({}))) as T & {
    message?: string | string[];
    error?: string;
  };
}

function errorMessage(data: { message?: string | string[]; error?: string }, fallback: string) {
  const raw = data.message ?? data.error;
  if (Array.isArray(raw)) return raw[0] || fallback;
  return raw || fallback;
}

/**
 * Create a Mail → apps/checkout session and return the redirect URL.
 * Prefer this over direct Qaseh pay from the mail UI.
 */
export async function startMailCheckoutSession(
  planId: MailPlanId,
  mailboxCount: number,
  appId = readMailAppIdFromDocument(),
): Promise<MailCheckoutSessionResponse> {
  if (!isValidMailAppId(appId)) {
    throw new Error("Open a workspace first, then continue to checkout.");
  }

  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/subscription/checkout-session`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: toApiMailPlan(planId),
        mailboxCount,
      }),
    },
  );

  const data = await readJson<MailCheckoutSessionResponse>(response);
  if (!response.ok || !data.checkoutUrl || !data.sessionId) {
    throw new Error(errorMessage(data, "Could not start checkout."));
  }

  // Defense in depth: never forward price/plan/seats in the browser URL,
  // even if an older API build still embeds them in checkoutUrl.
  return {
    ...(data as MailCheckoutSessionResponse),
    checkoutUrl: buildSafeMailCheckoutUrl(data.sessionId, data.checkoutUrl),
  };
}

/** Only product + session may appear in the checkout entry URL. */
function buildSafeMailCheckoutUrl(sessionId: string, fallbackUrl?: string): string {
  let base = resolveMailCheckoutBaseUrl();
  if (fallbackUrl) {
    try {
      const parsed = new URL(fallbackUrl);
      base = `${parsed.origin}`;
    } catch {
      // keep resolveMailCheckoutBaseUrl()
    }
  }
  return `${base}/?product=mail&session=${encodeURIComponent(sessionId)}`;
}

/** Resolve checkout base URL for fallbacks (client-side). */
export function resolveMailCheckoutBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_CHECKOUT_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:3010";
    }
  }
  return "https://checkout.rukny.io";
}
