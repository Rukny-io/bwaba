import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Resolve NestJS env files the same way Prisma does for local development.
 *
 * - From `dist/` or `src/`, `apiRoot` is always `apps/api` (or `/app` in Docker).
 * - In Docker, env vars come from `env_file` / `environment:` — these paths usually
 *   do not exist inside the image, so only existing files are returned.
 */
export function getEnvFilePaths(): string[] {
  const apiRoot = join(__dirname, '..', '..', '..');
  const repoRoot = join(apiRoot, '..', '..');

  const candidates = [
    join(apiRoot, '.env'),
    join(repoRoot, '.env.dev'),
    join(repoRoot, '.env'),
  ];

  return candidates.filter((filePath) => existsSync(filePath));
}
