import { NextResponse } from "next/server";
import {
  createMailDomainSetup,
  type MailDomainSetup,
} from "@/lib/mail-domain";
import {
  deleteMailDomainBinding,
  getMailDomainBinding,
  upsertMailDomainBinding,
} from "@/lib/mail-domain-bindings";
import {
  mailSetupCacheKey,
  redisDel,
  redisGetJson,
  redisSetJson,
} from "@/lib/redis";
import { getSesDomainStatusCached } from "@/lib/ses-admin";
import { requireMailAppSession } from "@/lib/require-mail-app";
import { syncMailAppDomainToNest } from "@/lib/sync-mail-app-domain";
import {
  MAIL_READY_APP_COOKIE,
  MAIL_READY_COOKIE,
} from "@/lib/ses";

const SETUP_CACHE_TTL_SECONDS = 60;

function buildSetupFromSes(
  domain: string,
  tokens: string[],
  active: boolean,
): MailDomainSetup {
  const setup = createMailDomainSetup(domain, tokens);
  setup.status = active ? "ACTIVE" : "PENDING_DNS";
  if (active) {
    setup.records = setup.records.map((record) => ({ ...record, status: "verified" }));
  }
  return setup;
}

function withReadyCookies(
  response: NextResponse,
  appId: string,
  active: boolean,
) {
  if (active) {
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

/**
 * Restore setup ONLY for the opened Mail app's binding.
 * Uses Redis for SES/setup caching (same REDIS_URL as Nest) — not browser localStorage.
 */
export async function GET() {
  const session = await requireMailAppSession();
  if (!session) {
    return NextResponse.json(
      { error: "Create and open a workspace first." },
      { status: 403 },
    );
  }

  const cacheKey = mailSetupCacheKey(session.appId);
  const cachedSetup = await redisGetJson<MailDomainSetup>(cacheKey);
  if (cachedSetup?.domain) {
    return withReadyCookies(
      NextResponse.json({ setup: cachedSetup }),
      session.appId,
      cachedSetup.status === "ACTIVE",
    );
  }

  const binding = await getMailDomainBinding(session.appId);
  if (!binding?.domain) {
    return NextResponse.json({ setup: null });
  }

  try {
    const status = await getSesDomainStatusCached(binding.domain);
    if (!status.found || status.tokens.length === 0) {
      await deleteMailDomainBinding(session.appId);
      await redisDel(cacheKey);
      await syncMailAppDomainToNest(session.appId, {
        primaryDomain: null,
        domainStatus: "NONE",
      });
      return NextResponse.json({ setup: null });
    }

    const active = status.sending && status.dkim === "SUCCESS";
    const setup = buildSetupFromSes(binding.domain, status.tokens, active);
    const checkedAt = new Date().toISOString();

    try {
      await upsertMailDomainBinding(session.appId, {
        domain: setup.domain,
        status: setup.status,
        dkimTokens: status.tokens,
        sesCheckedAt: checkedAt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Domain conflict.";
      return NextResponse.json({ error: message }, { status: 409 });
    }

    await redisSetJson(cacheKey, setup, SETUP_CACHE_TTL_SECONDS);

    await syncMailAppDomainToNest(session.appId, {
      primaryDomain: setup.domain,
      domainStatus: setup.status,
    });

    return withReadyCookies(
      NextResponse.json({ setup }),
      session.appId,
      setup.status === "ACTIVE",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not restore this domain.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
