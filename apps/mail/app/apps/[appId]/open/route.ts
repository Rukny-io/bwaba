import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  dedupeDomainBindings,
  getMailDomainBinding,
} from "@/lib/mail-domain-bindings";
import { isValidMailAppId, MAIL_APP_ID_COOKIE } from "@/lib/mail-app-id";
import { apiFetchJson, requireMailSession } from "@/lib/server-api";
import { warmMailAppOwnerCache } from "@/lib/require-mail-app";
import {
  buildSlotMap,
  invalidateUserSlotMap,
  setCachedUserSlotMap,
} from "@/lib/mail-slot-map";
import {
  MAIL_BOUND_DOMAIN_COOKIE,
  MAIL_READY_APP_COOKIE,
  MAIL_READY_COOKIE,
} from "@/lib/ses";

type RouteCtx = { params: Promise<{ appId: string }> };

export async function GET(request: Request, ctx: RouteCtx) {
  const { appId } = await ctx.params;
  if (!isValidMailAppId(appId)) {
    return NextResponse.redirect(new URL("/apps?error=invalid", request.url));
  }

  const session = await requireMailSession();
  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `/apps/${appId}/open`);
    return NextResponse.redirect(login);
  }

  const appResult = await apiFetchJson<{
    app: {
      appId: string;
      name: string;
      primaryDomain: string | null;
      slotIndex: number;
    };
  }>(`/mail/apps/${encodeURIComponent(appId)}`);
  if (!appResult.ok) {
    const response = NextResponse.redirect(new URL("/apps?error=not_found", request.url));
    response.cookies.set(MAIL_APP_ID_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
    response.cookies.set(MAIL_READY_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
    response.cookies.set(MAIL_READY_APP_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
    return response;
  }

  const slotIndex = appResult.data.app.slotIndex;
  if (!Number.isInteger(slotIndex) || slotIndex < 0) {
    return NextResponse.redirect(new URL("/apps?error=invalid", request.url));
  }

  const jar = await cookies();
  const accessToken =
    jar.get("access_token")?.value || jar.get("__Secure-access_token")?.value || "";
  if (accessToken) {
    await warmMailAppOwnerCache(appId, session.userId, session.email, accessToken);
  }

  // Refresh slot map so /uN resolves immediately.
  const listResult = await apiFetchJson<{
    apps: { appId: string; slotIndex: number }[];
  }>("/mail/apps");
  if (listResult.ok) {
    await setCachedUserSlotMap(
      session.userId,
      buildSlotMap(listResult.data.apps ?? []),
    );
  } else {
    await invalidateUserSlotMap(session.userId);
  }

  const cleared = await dedupeDomainBindings();
  for (const clearedId of cleared) {
    await apiFetchJson(`/mail/apps/${encodeURIComponent(clearedId)}`, {
      method: "PATCH",
      body: JSON.stringify({ primaryDomain: null }),
    });
  }

  const binding = await getMailDomainBinding(appId);
  const domainReady = binding?.status === "ACTIVE";

  const listedDomain = appResult.data.app.primaryDomain;
  if (binding?.domain && listedDomain !== binding.domain) {
    await apiFetchJson(`/mail/apps/${encodeURIComponent(appId)}`, {
      method: "PATCH",
      body: JSON.stringify({ primaryDomain: binding.domain }),
    });
  } else if (!binding && listedDomain) {
    await apiFetchJson(`/mail/apps/${encodeURIComponent(appId)}`, {
      method: "PATCH",
      body: JSON.stringify({ primaryDomain: null }),
    });
  }

  // Always land on mailboxes overview (/app), never inbox.
  const landing = `/u${slotIndex}/app`;
  const response = NextResponse.redirect(new URL(landing, request.url), 303);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.cookies.set(MAIL_APP_ID_COOKIE, appId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    sameSite: "lax",
  });
  response.cookies.set(MAIL_BOUND_DOMAIN_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });

  if (domainReady) {
    response.cookies.set(MAIL_READY_COOKIE, "1", {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    response.cookies.set(MAIL_READY_APP_COOKIE, appId, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
  } else {
    response.cookies.set(MAIL_READY_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
    response.cookies.set(MAIL_READY_APP_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
  }

  return response;
}
