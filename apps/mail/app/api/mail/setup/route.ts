import { NextResponse } from "next/server";
import { generateOwnershipToken } from "@rukny/domain-verification";
import {
  applyDnsCheckResults,
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
import { dkimTokensMatch } from "@/lib/mail-domain-tokens";
import { getSesDomainStatusCached } from "@/lib/ses-admin";
import { requireMailAppSession } from "@/lib/require-mail-app";
import { syncMailAppDomainToNest } from "@/lib/sync-mail-app-domain";
import { mailCookieClearOptions, mailCookieOptions } from "@/lib/mail-cookies";
import {
  MAIL_READY_APP_COOKIE,
  MAIL_READY_COOKIE,
} from "@/lib/ses";
import { verifyDomainDns } from "@/lib/verify-dns";

const SETUP_CACHE_TTL_SECONDS = 60;

function withReadyCookies(
  response: NextResponse,
  appId: string,
  active: boolean,
) {
  if (active) {
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
  let binding = await getMailDomainBinding(session.appId);
  if (!binding?.domain) {
    return NextResponse.json({ setup: null });
  }

  // Legacy ACTIVE bindings without ownership token must re-verify once.
  if (!binding.ownershipToken) {
    const ownershipToken = generateOwnershipToken();
    binding = {
      ...binding,
      ownershipToken,
      ownershipVerifiedAt: undefined,
      status: "PENDING_DNS",
    };
    await upsertMailDomainBinding(session.appId, binding);
    await syncMailAppDomainToNest(session.appId, {
      primaryDomain: binding.domain,
      domainStatus: "PENDING_DNS",
      domainOwnershipToken: ownershipToken,
      domainOwnershipVerifiedAt: null,
    });
  }

  try {
    const status = await getSesDomainStatusCached(binding.domain);
    const cachedSetup = await redisGetJson<MailDomainSetup>(cacheKey);
    if (
      cachedSetup?.domain === binding.domain &&
      cachedSetup.dkimTokens?.length &&
      status.tokens.length > 0 &&
      dkimTokensMatch(cachedSetup.dkimTokens, status.tokens) &&
      cachedSetup.status !== "ACTIVE"
    ) {
      return withReadyCookies(
        NextResponse.json({ setup: cachedSetup, tokensChanged: false }),
        session.appId,
        false,
      );
    }
    if (!status.found || status.tokens.length === 0) {
      await deleteMailDomainBinding(session.appId);
      await redisDel(cacheKey);
      await syncMailAppDomainToNest(session.appId, {
        primaryDomain: null,
        domainStatus: "NONE",
        domainOwnershipToken: null,
        domainOwnershipVerifiedAt: null,
      });
      return NextResponse.json({ setup: null });
    }

    const tokens = status.tokens.length > 0 ? status.tokens : binding.dkimTokens ?? [];
    const dnsResult = await verifyDomainDns(
      binding.domain,
      tokens,
      binding.ownershipToken,
    );
    if (!dnsResult.ok) {
      return NextResponse.json({ error: dnsResult.error }, { status: 400 });
    }

    const verified = dnsResult.verified;
    let setup = createMailDomainSetup(binding.domain, tokens, binding.ownershipToken);
    setup = applyDnsCheckResults(
      setup,
      dnsResult.results,
      verified,
      dnsResult.waiting,
    );
    const checkedAt = new Date().toISOString();
    const tokensChanged = !dkimTokensMatch(binding.dkimTokens ?? [], status.tokens);
    const ownershipVerifiedAt = verified ? checkedAt : binding.ownershipVerifiedAt;

    try {
      await upsertMailDomainBinding(session.appId, {
        domain: setup.domain,
        status: setup.status,
        dkimTokens: tokens,
        sesCheckedAt: checkedAt,
        ownershipToken: binding.ownershipToken,
        ownershipVerifiedAt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Domain conflict.";
      return NextResponse.json({ error: message }, { status: 409 });
    }

    await redisSetJson(cacheKey, setup, SETUP_CACHE_TTL_SECONDS);

    await syncMailAppDomainToNest(session.appId, {
      primaryDomain: setup.domain,
      domainStatus: setup.status,
      domainOwnershipToken: binding.ownershipToken,
      domainOwnershipVerifiedAt: verified ? checkedAt : null,
    });

    return withReadyCookies(
      NextResponse.json({
        setup,
        tokensChanged,
      }),
      session.appId,
      setup.status === "ACTIVE",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not restore this domain.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
