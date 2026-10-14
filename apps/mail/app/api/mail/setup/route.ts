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
import { mailSetupCacheKey, redisSetJson } from "@/lib/redis";
import { dkimTokensMatch } from "@/lib/mail-domain-tokens";
import { requireMailAppSession } from "@/lib/require-mail-app";
import { apiFetchJson } from "@/lib/server-api";
import { syncMailAppDomainToNest } from "@/lib/sync-mail-app-domain";
import { mailCookieClearOptions, mailCookieOptions } from "@/lib/mail-cookies";
import {
  MAIL_READY_APP_COOKIE,
  MAIL_READY_COOKIE,
} from "@/lib/ses";

const SETUP_CACHE_TTL_SECONDS = 60;
const softSync = { soft: true } as const;

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

  const appResult = await apiFetchJson<{ app?: { isOwner?: boolean } }>(
    `/mail/apps/${encodeURIComponent(session.appId)}`,
  );
  const isOwner =
    appResult.ok && appResult.data.app ? appResult.data.app.isOwner !== false : false;

  // Legacy ACTIVE bindings without ownership token must re-verify once (owner only).
  if (isOwner && !binding.ownershipToken) {
    const ownershipToken = generateOwnershipToken();
    binding = {
      ...binding,
      ownershipToken,
      ownershipVerifiedAt: undefined,
      status: "PENDING_DNS",
    };
    await upsertMailDomainBinding(session.appId, binding);
    await syncMailAppDomainToNest(
      session.appId,
      {
        primaryDomain: binding.domain,
        domainStatus: "PENDING_DNS",
        domainOwnershipToken: ownershipToken,
        domainOwnershipVerifiedAt: null,
      },
      softSync,
    );
  }

  // Provider/DNS status is authoritative in Nest API. The Next route only
  // materializes the UI cache and browser cookies from that response.
  const remote = await apiFetchJson<{
    setup?: null;
    ok?: boolean;
    domain?: string;
    verified?: boolean;
    waiting?: boolean;
    results?: Array<{ id: string; status: "pending" | "checking" | "verified" | "failed" }>;
    tokens?: string[];
    checkedAt?: string;
  }>(`/mail/apps/${encodeURIComponent(session.appId)}/domain/status`);
  if (remote.ok) {
    if (!remote.data.domain || !remote.data.tokens?.length) {
      return withReadyCookies(NextResponse.json({ setup: null }), session.appId, false);
    }
    const tokens = remote.data.tokens;
    const checkedAt = remote.data.checkedAt ?? new Date().toISOString();
    const setup = applyDnsCheckResults(
      createMailDomainSetup(
        remote.data.domain,
        tokens,
        binding.ownershipToken,
      ),
      remote.data.results ?? [],
      remote.data.verified === true,
      remote.data.waiting === true,
    );
    await upsertMailDomainBinding(session.appId, {
      domain: setup.domain,
      status: setup.status,
      dkimTokens: tokens,
      sesCheckedAt: checkedAt,
      ownershipToken: binding.ownershipToken,
      ownershipVerifiedAt: remote.data.verified ? checkedAt : binding.ownershipVerifiedAt,
    });
    await redisSetJson(cacheKey, setup, SETUP_CACHE_TTL_SECONDS);
    return withReadyCookies(
      NextResponse.json({ setup, tokensChanged: !dkimTokensMatch(binding.dkimTokens ?? [], tokens) }),
      session.appId,
      remote.data.verified === true,
    );
  }

  // The Nest API owns SES/DNS credentials and is the single source of truth.
  // Fail closed if it is unavailable instead of executing provider calls in the BFF.
  return NextResponse.json(
    { error: remote.error || "Mail domain status service is unavailable." },
    { status: 502 },
  );
}
