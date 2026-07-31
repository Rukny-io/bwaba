import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 🔒 F-07: Marks a route (or whole controller) as intentionally public,
 * whitelisting it from the global JwtAuthGuard (default-deny).
 *
 * Apply ONLY to endpoints that must be reachable without authentication:
 * OAuth callbacks, the OAuth code exchange, public profile/store/event views,
 * public form submissions, health checks, and webhooks.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
