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
import {
  deleteSesDomainIdentity,
  ensureSesDomainIdentity,
  formatSesError,
} from "@/lib/ses-admin";
import { apiFetchJson } from "@/lib/server-api";
import { requireMailAppSession } from "@/lib/require-mail-app";
import { MAIL_READY_APP_COOKIE, MAIL_READY_COOKIE } from "@/lib/ses";
import {
  mailSetupCacheKey,
  mailSesStatusKey,
  mailAppOwnerKey,
  redisDel,
  redisSetJson,
} from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
    },
  );
}

export async function POST(request: Request) {
  try {
    const session = await requireMailAppSession({ fresh: true });
    if (!session) {
      return jsonError("Please login again, then open your Mail app.", 401);
    }

    const body = (await request.json().catch(() => null)) as { domain?: string } | null;
    const domain = normalizeDomain(body?.domain ?? "");
    const error = validateDomain(domain);
    if (error) {
      return jsonError(error, 400);
    }

    const owner = await findMailAppIdByDomain(domain);
    if (owner && owner !== session.appId) {
      return jsonError(
        "This domain is already connected to another Mail app. Use a different domain.",
        409,
      );
    }

    if (!process.env.AWS_ACCESS_KEY_ID?.trim() || !process.env.AWS_SECRET_ACCESS_KEY?.trim()) {
      return jsonError(
        "AWS credentials are not configured for Mail. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, then restart the mail service.",
        503,
      );
    }

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

    return NextResponse.json(
      { setup },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = formatSesError(error);
    console.error("[mail/domains POST]", message, error);
    const status = message.includes("already connected") ? 409 : 502;
    return jsonError(message, status);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireMailAppSession({ fresh: true });
    if (!session) {
      return jsonError("Please login again, then open your Mail app.", 401);
    }

    const domain = normalizeDomain(new URL(request.url).searchParams.get("domain") ?? "");
    const error = validateDomain(domain);
    if (error) {
      return jsonError(error, 400);
    }

    const owner = await findMailAppIdByDomain(domain);
    if (owner && owner !== session.appId) {
      return jsonError("This domain belongs to another Mail app.", 403);
    }

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

    const response = NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(MAIL_READY_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
    response.cookies.set(MAIL_READY_APP_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
    return response;
  } catch (error) {
    const message = formatSesError(error);
    console.error("[mail/domains DELETE]", message, error);
    return jsonError(message, 502);
  }
}
