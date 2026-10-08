import { NextResponse } from "next/server";
import { generateOwnershipToken } from "@rukny/domain-verification";
import {
  deleteMailDomainBinding,
  findMailAppIdByDomain,
  getMailDomainBinding,
  upsertMailDomainBinding,
} from "@/lib/mail-domain-bindings";
import { applyDnsCheckResults, createMailDomainSetup, normalizeDomain } from "@/lib/mail-domain";
import { requireMailAppSession } from "@/lib/require-mail-app";
import { apiFetchJson } from "@/lib/server-api";
import { syncMailAppDomainToNest } from "@/lib/sync-mail-app-domain";
import { mailCookieOptions } from "@/lib/mail-cookies";
import {
  MAIL_READY_APP_COOKIE,
  MAIL_READY_COOKIE,
} from "@/lib/ses";
import { mailSetupCacheKey, redisDel, redisSetJson } from "@/lib/redis";
import { resolveDkimTokens } from "@/lib/mail-domain-tokens";
import { verifyDomainDns } from "@/lib/verify-dns";

export async function POST(request: Request) {
  const session = await requireMailAppSession({ fresh: true });
  if (!session) {
    return NextResponse.json(
      { error: "Create and open a workspace first." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    domain?: string;
  } | null;
  const domain = body?.domain;
  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "Domain is required." }, { status: 400 });
  }

  const normalized = normalizeDomain(domain);
  const owner = await findMailAppIdByDomain(normalized);
  if (owner && owner !== session.appId) {
    const taken = await apiFetchJson<{ taken?: boolean }>(
      `/mail/apps/domain-taken?domain=${encodeURIComponent(normalized)}`,
    );
    if (taken.ok && taken.data.taken === true) {
      return NextResponse.json(
        {
          error:
            "This domain is already connected to another workspace. Use a different domain.",
        },
        { status: 409 },
      );
    }
    await deleteMailDomainBinding(owner);
  }

  const binding = await getMailDomainBinding(session.appId);
  const bindingTokens = binding?.domain === normalized ? binding.dkimTokens ?? [] : [];
  const ownershipToken =
    binding?.domain === normalized && binding.ownershipToken
      ? binding.ownershipToken
      : generateOwnershipToken();
  const result = await verifyDomainDns(domain, bindingTokens, ownershipToken);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const tokens = resolveDkimTokens(result.ses?.tokens ?? [], bindingTokens);
  const response = NextResponse.json({ ...result, tokens });
  const checkedAt = new Date().toISOString();

  if (normalized) {
    const status = result.verified ? "ACTIVE" : "PENDING_DNS";
    try {
      await upsertMailDomainBinding(session.appId, {
        domain: normalized,
        status,
        dkimTokens: tokens,
        sesCheckedAt: checkedAt,
        ownershipToken,
        ownershipVerifiedAt: result.verified ? checkedAt : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Domain conflict.";
      return NextResponse.json({ error: message }, { status: 409 });
    }

    await redisDel(mailSetupCacheKey(session.appId));
    if (tokens.length > 0) {
      let setup = createMailDomainSetup(normalized, tokens, ownershipToken);
      setup = applyDnsCheckResults(
        setup,
        result.results,
        result.verified,
        result.waiting,
      );
      await redisSetJson(mailSetupCacheKey(session.appId), setup, 60);
    }

    let sync: Awaited<ReturnType<typeof syncMailAppDomainToNest>>;
    try {
      sync = await syncMailAppDomainToNest(session.appId, {
        primaryDomain: normalized,
        domainStatus: status,
        dkimTokens: tokens,
        domainOwnershipToken: ownershipToken,
        domainOwnershipVerifiedAt: result.verified ? checkedAt : null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save domain status.";
      const httpStatus = message.includes("limit reached") ? 402 : 502;
      return NextResponse.json({ error: message }, { status: httpStatus });
    }

    if (result.verified) {
      response.cookies.set(MAIL_READY_COOKIE, "1", mailCookieOptions(31536000));
      response.cookies.set(
        MAIL_READY_APP_COOKIE,
        session.appId,
        mailCookieOptions(31536000),
      );
    }

    if (result.verified && sync.activated) {
      return NextResponse.json({
        ...result,
        tokens,
        activated: true,
        needsCheckout: false,
      });
    }

    if (result.verified && sync.needsCheckout && sync.checkoutSessionId) {
      const checkoutBase =
        process.env.NEXT_PUBLIC_CHECKOUT_URL?.replace(/\/$/, "") ||
        "http://localhost:3010";
      const checkoutUrl = `${checkoutBase}/?product=mail&session=${encodeURIComponent(sync.checkoutSessionId)}`;
      return NextResponse.json({
        ...result,
        tokens,
        needsCheckout: true,
        checkoutUrl,
        checkoutSessionId: sync.checkoutSessionId,
      });
    }
  }

  return response;
}
