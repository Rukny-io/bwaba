import { NextResponse } from "next/server";
import {
  createMailDomainSetup,
  normalizeDomain,
  validateDomain,
} from "@/lib/mail-domain";
import {
  deleteMailDomainBinding,
  findMailAppIdByDomain,
  upsertMailDomainBinding,
} from "@/lib/mail-domain-bindings";
import { deleteSesDomainIdentity, ensureSesDomainIdentity } from "@/lib/ses-admin";
import { apiFetchJson } from "@/lib/server-api";
import { requireMailAppSession } from "@/lib/require-mail-app";
import { MAIL_READY_APP_COOKIE, MAIL_READY_COOKIE } from "@/lib/ses";
import { mailSetupCacheKey, mailSesStatusKey, mailAppOwnerKey, redisDel, redisSetJson } from "@/lib/redis";

export async function POST(request: Request) {
  const session = await requireMailAppSession({ fresh: true });
  if (!session) {
    return NextResponse.json(
      { error: "Please login again, then open your Mail app." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as { domain?: string } | null;
  const domain = normalizeDomain(body?.domain ?? "");
  const error = validateDomain(domain);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const owner = await findMailAppIdByDomain(domain);
  if (owner && owner !== session.appId) {
    return NextResponse.json(
      {
        error:
          "This domain is already connected to another Mail app. Use a different domain.",
      },
      { status: 409 },
    );
  }

  try {
    const { tokens } = await ensureSesDomainIdentity(domain);
    const setup = createMailDomainSetup(domain, tokens);

    await upsertMailDomainBinding(session.appId, {
      domain: setup.domain,
      status: setup.status,
      dkimTokens: tokens,
      sesCheckedAt: new Date().toISOString(),
    });
    await redisDel(mailSetupCacheKey(session.appId));
    await redisSetJson(mailSetupCacheKey(session.appId), setup, 60);
    await apiFetchJson(`/mail/apps/${encodeURIComponent(session.appId)}`, {
      method: "PATCH",
      body: JSON.stringify({ primaryDomain: setup.domain }),
    });

    return NextResponse.json({ setup });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add this domain.";
    const status = message.includes("already connected") ? 409 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  const session = await requireMailAppSession({ fresh: true });
  if (!session) {
    return NextResponse.json(
      { error: "Please login again, then open your Mail app." },
      { status: 401 },
    );
  }

  const domain = normalizeDomain(new URL(request.url).searchParams.get("domain") ?? "");
  const error = validateDomain(domain);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const owner = await findMailAppIdByDomain(domain);
  if (owner && owner !== session.appId) {
    return NextResponse.json(
      { error: "This domain belongs to another Mail app." },
      { status: 403 },
    );
  }

  try {
    await deleteSesDomainIdentity(domain);
    await deleteMailDomainBinding(session.appId);
    await redisDel(
      mailSetupCacheKey(session.appId),
      mailSesStatusKey(domain),
      `${mailAppOwnerKey(session.appId)}:${session.userId}`,
    );
    await apiFetchJson(`/mail/apps/${encodeURIComponent(session.appId)}`, {
      method: "PATCH",
      body: JSON.stringify({ primaryDomain: null }),
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(MAIL_READY_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
    response.cookies.set(MAIL_READY_APP_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove this domain.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
