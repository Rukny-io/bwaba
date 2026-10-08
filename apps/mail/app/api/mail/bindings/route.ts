import { NextResponse } from "next/server";
import { getMailDomainBinding } from "@/lib/mail-domain-bindings";
import { requireMailAppSession } from "@/lib/require-mail-app";
import { releaseMailDomain } from "@/lib/release-mail-domain";
import { mailCookieClearOptions } from "@/lib/mail-cookies";
import { MAIL_READY_APP_COOKIE, MAIL_READY_COOKIE } from "@/lib/ses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Release this workspace's domain lock and delete the SES identity.
 * Used when archiving a workspace so the domain can be claimed again safely.
 */
export async function DELETE() {
  const session = await requireMailAppSession({ fresh: true });
  if (!session) {
    return NextResponse.json(
      { error: "Please login again, then open your workspace." },
      { status: 401 },
    );
  }

  const binding = await getMailDomainBinding(session.appId);
  if (binding?.domain) {
    await releaseMailDomain(session.appId, binding.domain, session.userId);
  } else {
    await releaseMailDomain(session.appId, "", session.userId);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(MAIL_READY_COOKIE, "", mailCookieClearOptions());
  response.cookies.set(MAIL_READY_APP_COOKIE, "", mailCookieClearOptions());
  return response;
}
