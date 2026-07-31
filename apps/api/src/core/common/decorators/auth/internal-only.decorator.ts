import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { InternalApiGuard } from '../../guards/auth/internal-api.guard';

/**
 * 🔒 Marks a route/controller as internal-only.
 *
 * Applies {@link InternalApiGuard}, which requires the `x-internal-api-secret`
 * header to match `INTERNAL_API_SECRET`. Fails closed when the secret is unset.
 */
export function InternalOnly() {
  return applyDecorators(
    UseGuards(InternalApiGuard),
    ApiHeader({
      name: 'x-internal-api-secret',
      required: true,
      description: 'Shared secret for internal service-to-service calls',
    }),
  );
}
