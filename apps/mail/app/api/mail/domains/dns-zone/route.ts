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
import { formatSesError, getSesDomainStatus } from "@/lib/ses-admin";

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

    const ses = await getSesDomainStatus(domain);
    if (!ses.found || ses.tokens.length === 0) {
      return NextResponse.json(
        { error: "SES identity or DKIM tokens are not ready yet. Try again shortly." },
        { status: 409 },
      );
    }

    const records = buildDnsRecords(domain, ses.tokens);
    const tokensChanged = !dkimTokensMatch(binding.dkimTokens ?? [], ses.tokens);

    return NextResponse.json(
      {
        domain,
        tokens: ses.tokens,
        tokensChanged,
        records,
        zoneFile: recordsAsZoneFile(domain, records),
        ses: {
          dkim: ses.dkim,
          sending: ses.sending,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: formatSesError(error) },
      { status: 502 },
    );
  }
}
