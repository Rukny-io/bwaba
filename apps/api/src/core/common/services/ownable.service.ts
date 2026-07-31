import { ForbiddenException, NotFoundException } from '@nestjs/common';

/**
 * 🔒 F-08 — Ownership enforcement base class.
 *
 * IDOR protection must not depend on developers remembering to add a decorator.
 * Services that expose per-user resources should extend this class (or use its
 * static helpers) so every read/write/bulk operation is scoped by the owner key
 * (`userId` / `profileId`) at the query layer.
 *
 * Usage:
 *   class SocialLinksService extends OwnableService {
 *     async remove(userId, id) {
 *       await this.assertOwned(this.prisma.socialLink, id, { profileId }, ...);
 *     }
 *   }
 */
export abstract class OwnableService {
  /**
   * Build a where-clause that is always scoped to the owner. Never issue a
   * query on an ownable resource without threading the owner scope through.
   */
  protected scopedWhere<T extends Record<string, any>>(
    ownerScope: T,
    extra: Record<string, any> = {},
  ): T & Record<string, any> {
    return { ...ownerScope, ...extra };
  }

  /**
   * Assert a single resource exists AND is owned. Throws 404 if missing,
   * 403 if it exists but belongs to someone else.
   */
  protected async assertOwned(
    delegate: {
      findFirst: (args: any) => Promise<any>;
    },
    id: string,
    ownerScope: Record<string, any>,
    resourceName = 'Resource',
  ): Promise<any> {
    const owned = await delegate.findFirst({
      where: { id, ...ownerScope },
    });
    if (owned) return owned;

    // Distinguish "not found" from "not yours" without leaking existence to
    // the owner path: if it exists under a different owner → 403, else → 404.
    const exists = await delegate.findFirst({ where: { id } });
    if (exists) {
      throw new ForbiddenException(
        `You are not authorized to access this ${resourceName.toLowerCase()}`,
      );
    }
    throw new NotFoundException(`${resourceName} not found`);
  }

  /**
   * Assert EVERY id in a bulk operation is owned by the caller. Returns the
   * owned rows. Throws 403 if any id is missing or not owned — preventing an
   * attacker from smuggling foreign ids into a bulk request.
   */
  protected async assertAllOwned(
    delegate: {
      findMany: (args: any) => Promise<any[]>;
    },
    ids: string[],
    ownerScope: Record<string, any>,
    resourceName = 'Resource',
  ): Promise<any[]> {
    const uniqueIds = Array.from(new Set(ids));
    const owned = await delegate.findMany({
      where: { id: { in: uniqueIds }, ...ownerScope },
    });
    if (owned.length !== uniqueIds.length) {
      throw new ForbiddenException(
        `One or more ${resourceName.toLowerCase()} items do not belong to you or do not exist`,
      );
    }
    return owned;
  }
}
