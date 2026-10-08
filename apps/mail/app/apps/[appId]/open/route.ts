import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  dedupeDomainBindings,
  getMailDomainBinding,
} from "@/lib/mail-domain-bindings";
import { isValidMailAppId, MAIL_APP_ID_COOKIE } from "@/lib/mail-app-id";
import { apiFetchJson, requireMailSession } from "@/lib/server-api";
import { syncMailAppDomainToNest } from "@/lib/sync-mail-app-domain";
import { warmMailAppOwnerCache } from "@/lib/require-mail-app";
import {
  buildSlotMap,
  invalidateUserSlotMap,
  setCachedUserSlotMap,
} from "@/lib/mail-slot-map";
import {
  MAIL_BOUND_DOMAIN_COOKIE,
  MAIL_PLAN_COOKIE,
  MAIL_READY_APP_COOKIE,
  MAIL_READY_COOKIE,
  MAIL_SHELL_COOKIE,
} from "@/lib/ses";
import { resolveMailRequestOrigin } from "@/lib/auth-redirect";
import { mailCookieClearOptions, mailCookieOptions } from "@/lib/mail-cookies";

type RouteCtx = { params: Promise<{ appId: string }> };

export async function GET(request: Request, ctx: RouteCtx) {
  const { appId } = await ctx.params;
  const origin = resolveMailRequestOrigin(request);
  if (!isValidMailAppId(appId)) {
    return NextResponse.redirect(new URL("/apps?error=invalid", origin));
  }

  const session = await requireMailSession();
  if (!session) {
    const login = new URL("/login", origin);
    login.searchParams.set("next", `/apps/${appId}/open`);
    return NextResponse.redirect(login);
  }

  const appResult = await apiFetchJson<{
    app: {
      appId: string;
      name: string;
      primaryDomain: string | null;
      slotIndex: number;
      isOwner?: boolean;
    };
  }>(`/mail/apps/${encodeURIComponent(appId)}`);
  if (!appResult.ok) {
    const response = NextResponse.redirect(new URL("/apps?error=not_found", origin));
    response.cookies.set(MAIL_APP_ID_COOKIE, "", mailCookieClearOptions());
    response.cookies.set(MAIL_READY_COOKIE, "", mailCookieClearOptions());
    response.cookies.set(MAIL_READY_APP_COOKIE, "", mailCookieClearOptions());
    response.cookies.set(MAIL_SHELL_COOKIE, "", mailCookieClearOptions());
    return response;
  }

  const slotIndex = appResult.data.app.slotIndex;
  if (!Number.isInteger(slotIndex) || slotIndex < 0) {
    return NextResponse.redirect(new URL("/apps?error=invalid", origin));
  }

  const isOwner = appResult.data.app.isOwner !== false;

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

  const binding = await getMailDomainBinding(appId);
  const domainReady = binding?.status === "ACTIVE";

  // Domain write-back is owner-only. Team members (added by admin) must not PATCH.
  if (isOwner) {
    const cleared = await dedupeDomainBindings();
    for (const clearedId of cleared) {
      await syncMailAppDomainToNest(
        clearedId,
        { primaryDomain: null, domainStatus: "NONE" },
        { soft: true },
      );
    }

    const listedDomain = appResult.data.app.primaryDomain;
    if (binding?.domain) {
      await syncMailAppDomainToNest(
        appId,
        {
          primaryDomain: binding.domain,
          domainStatus: binding.status,
        },
        { soft: true },
      );
    } else if (listedDomain) {
      await syncMailAppDomainToNest(
        appId,
        { primaryDomain: null, domainStatus: "NONE" },
        { soft: true },
      );
    }
  }

  // Check active subscription — required before console tools after DNS.
  const subResult = await apiFetchJson<{
    subscription?: { status?: string } | null;
    hasWorkspaceAccess?: boolean;
    unifiedLimits?: { mailboxCount: number } | null;
  }>(`/mail/apps/${encodeURIComponent(appId)}/subscription`);
  const hasActivePlan =
    subResult.ok &&
    (Boolean(subResult.data.hasWorkspaceAccess) ||
      subResult.data.subscription?.status === "ACTIVE");

  // Land on mailboxes overview (/app); quick sign-in links ask for the inbox.
  const wantsInbox = new URL(request.url).searchParams.get("next") === "inbox";
  const landing =
    wantsInbox && domainReady ? `/u${slotIndex}/inbox` : `/u${slotIndex}/app`;
  const response = NextResponse.redirect(new URL(landing, origin), 303);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.cookies.set(
    MAIL_APP_ID_COOKIE,
    appId,
    mailCookieOptions(60 * 60 * 24 * 90),
  );
  response.cookies.set(MAIL_BOUND_DOMAIN_COOKIE, "", mailCookieClearOptions());
  // Entering a workspace always unlocks console chrome (sidebar + top nav).
  response.cookies.set(MAIL_SHELL_COOKIE, "1", mailCookieOptions(31536000));

  if (domainReady) {
    response.cookies.set(MAIL_READY_COOKIE, "1", mailCookieOptions(31536000));
    response.cookies.set(
      MAIL_READY_APP_COOKIE,
      appId,
      mailCookieOptions(31536000),
    );
  } else {
    response.cookies.set(MAIL_READY_COOKIE, "", mailCookieClearOptions());
    response.cookies.set(MAIL_READY_APP_COOKIE, "", mailCookieClearOptions());
  }

  if (hasActivePlan) {
    response.cookies.set(
      MAIL_PLAN_COOKIE,
      "1",
      mailCookieOptions(60 * 60 * 24 * 30),
    );
  } else {
    response.cookies.set(MAIL_PLAN_COOKIE, "", mailCookieClearOptions());
  }

  return response;
}
