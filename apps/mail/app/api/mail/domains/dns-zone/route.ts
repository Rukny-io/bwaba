import { NextResponse } from "next/server";
import {
  buildDnsRecords,
  normalizeDomain,
  recordsAsZoneFile,
  validateDomain,
} from "@/lib/mail-domain";
import { getMailDomainBinding } from "@/lib/mail-domain-bindings";
import { dkimTokensMatch } from "@/lib/mail-domain-tokens";
import { requireMailAppSession } from "@/lib/require-mail-app";
import { apiFetchJson } from "@/lib/server-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fresh DNS export from live SES (never stale localStorage tokens).
 * GET /api/mail/domains/dns-zone?domain=example.com
 */
export async function GET(request: Request) {
  try {
    const session = await requireMailAppSession({ fresh: true });
    if (!session) {
      return NextResponse.json({ error: "Please login again." }, { status: 401 });
    }

    const domain = normalizeDomain(
      new URL(request.url).searchParams.get("domain") ?? "",
    );
    const error = validateDomain(domain);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const binding = await getMailDomainBinding(session.appId);
    if (!binding?.domain || binding.domain !== domain) {
      return NextResponse.json(
        { error: "This domain is not connected to your workspace." },
        { status: 403 },
      );
    }

    const remote = await apiFetchJson<{
      domain?: string;
      tokens?: string[];
      verified?: boolean;
      results?: Array<{ id: string; status: "pending" | "checking" | "verified" | "failed" }>;
      ses?: { dkim?: string; sending?: string };
    }>(`/mail/apps/${encodeURIComponent(session.appId)}/domain/status`);
    if (!remote.ok || !remote.data.tokens?.length) {
      return NextResponse.json(
        { error: remote.ok ? "SES identity or DKIM tokens are not ready yet. Try again shortly." : remote.error },
        { status: remote.ok ? 409 : remote.status },
      );
    }
    const tokens = remote.data.tokens;

    const records = buildDnsRecords(
      domain,
      tokens,
      binding.ownershipToken,
    );
    const tokensChanged = !dkimTokensMatch(binding.dkimTokens ?? [], tokens);

    return NextResponse.json(
      {
        domain,
        tokens,
        tokensChanged,
        records,
        zoneFile: recordsAsZoneFile(domain, records),
        ses: {
          dkim: remote.data.ses?.dkim,
          sending: remote.data.ses?.sending,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load domain status." }, { status: 502 });
  }
}
