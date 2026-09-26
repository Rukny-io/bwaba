import { NextResponse, type NextRequest } from "next/server";
import {
  applySecurityHeaders,
  applySecurityHeadersToRequest,
  createSecurityHeadersContext,
  type SecurityHeadersContext,
} from "@rukny/forms-shared/apply-security-headers";
import { parseApiConnectOrigins } from "@rukny/forms-shared/security-headers";

const SECURITY_OPTS = {
  isDev: process.env.NODE_ENV !== "production",
  apiConnectOrigins: parseApiConnectOrigins(process.env.NEXT_PUBLIC_API_URL),
} as const;

export function createMailSecurityContext(): SecurityHeadersContext {
  return createSecurityHeadersContext(SECURITY_OPTS);
}

export function secureResponse(
  response: NextResponse,
  security: SecurityHeadersContext = createMailSecurityContext(),
): NextResponse {
  return applySecurityHeaders(response, security);
}

export function secureNext(
  request: NextRequest,
  security: SecurityHeadersContext = createMailSecurityContext(),
): NextResponse {
  const requestHeaders = applySecurityHeadersToRequest(request, security);
  return secureResponse(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }),
    security,
  );
}
