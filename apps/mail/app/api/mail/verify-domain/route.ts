import { NextResponse } from "next/server";
import { findMailAppIdByDomain, upsertMailDomainBinding } from "@/lib/mail-domain-bindings";
import { createMailDomainSetup, normalizeDomain } from "@/lib/mail-domain";
import { requireMailAppSession } from "@/lib/require-mail-app";
import { syncMailAppDomainToNest } from "@/lib/sync-mail-app-domain";
import {
  MAIL_READY_APP_COOKIE,
  MAIL_READY_COOKIE,
} from "@/lib/ses";
import { mailSetupCacheKey, redisDel, redisSetJson } from "@/lib/redis";
import { verifyDomainDns } from "@/lib/verify-dns";

export async function POST(request: Request) {
  const session = await requireMailAppSession({ fresh: true });
  if (!session) {
    return NextResponse.json(
      { error: "Create and open a Mail app first." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    domain?: string;
    tokens?: string[];
  } | null;
  const domain = body?.domain;
  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "Domain is required." }, { status: 400 });
  }

  const normalized = normalizeDomain(domain);
  const owner = await findMailAppIdByDomain(normalized);
  if (owner && owner !== session.appId) {
    return NextResponse.json(
      {
        error:
          "This domain is already connected to another Mail app. Use a different domain.",
      },
      { status: 409 },
    );
  }

  const result = await verifyDomainDns(domain, Array.isArray(body?.tokens) ? body.tokens : []);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const response = NextResponse.json(result);

  if (normalized) {
    const status = result.verified ? "ACTIVE" : "PENDING_DNS";
    const tokens = Array.isArray(body?.tokens) ? body.tokens : result.ses?.tokens ?? [];
    try {
      await upsertMailDomainBinding(session.appId, {
        domain: normalized,
        status,
        dkimTokens: tokens,
        sesCheckedAt: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Domain conflict.";
      return NextResponse.json({ error: message }, { status: 409 });
    }

    await redisDel(mailSetupCacheKey(session.appId));
    if (tokens.length > 0) {
      const setup = createMailDomainSetup(normalized, tokens);
      setup.status = status;
      if (status === "ACTIVE") {
        setup.records = setup.records.map((record) => ({
          ...record,
          status: "verified" as const,
        }));
      }
      await redisSetJson(mailSetupCacheKey(session.appId), setup, 60);
    }

    await syncMailAppDomainToNest(session.appId, {
      primaryDomain: normalized,
      domainStatus: status,
    });

    if (result.verified) {
      response.cookies.set(MAIL_READY_COOKIE, "1", {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      });
      response.cookies.set(MAIL_READY_APP_COOKIE, session.appId, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      });
    }
  }

  return response;
}
