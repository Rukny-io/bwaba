import { NextResponse } from "next/server";
import { deleteMailDomainBinding } from "@/lib/mail-domain-bindings";
import { requireMailAppSession } from "@/lib/require-mail-app";
import { syncMailAppDomainToNest } from "@/lib/sync-mail-app-domain";
import { MAIL_READY_APP_COOKIE, MAIL_READY_COOKIE } from "@/lib/ses";
import {
  mailSetupCacheKey,
  mailAppOwnerKey,
  redisDel,
} from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Release this workspace's domain lock in Redis without deleting the SES identity.
 * Used when archiving a workspace so the domain can be claimed again.
 */
export async function DELETE() {
  const session = await requireMailAppSession({ fresh: true });
  if (!session) {
    return NextResponse.json(
      { error: "Please login again, then open your workspace." },
      { status: 401 },
    );
  }

  await deleteMailDomainBinding(session.appId);
  await redisDel(
    mailSetupCacheKey(session.appId),
    `${mailAppOwnerKey(session.appId)}:${session.userId}`,
  );
  await syncMailAppDomainToNest(session.appId, {
    primaryDomain: null,
    domainStatus: "NONE",
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(MAIL_READY_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
  response.cookies.set(MAIL_READY_APP_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
  return response;
}
