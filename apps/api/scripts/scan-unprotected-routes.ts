/**
 * 🔒 F-07 — Unprotected route scanner (CI guard).
 *
 * Statically scans every *.controller.ts file and reports HTTP route handlers
 * that are neither authenticated (a JWT/roles/owner guard at method OR class
 * level) nor explicitly whitelisted with `@Public()`.
 *
 * Use in CI to block PRs that add an endpoint without a conscious auth choice:
 *   ts-node apps/api/scripts/scan-unprotected-routes.ts
 * Exit code 1 when unclassified routes are found.
 *
 * Note: with the global GlobalJwtAuthGuard, unmarked routes are auth-required
 * by default — but forcing an explicit @Public()/guard keeps intent reviewable.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', 'src');
const HTTP_DECORATORS = ['Get', 'Post', 'Put', 'Patch', 'Delete', 'All'];
const AUTH_GUARD_HINTS = [
  'JwtAuthGuard',
  'OptionalJwtAuthGuard',
  'RolesGuard',
  'OwnerGuard',
  'PlanGuard',
  'ApiKeyGuard',
  'WebhookGuard',
  'TwoFactorRequiredGuard',
  'GoogleAuthGuard',
  'LinkedInAuthGuard',
  'FacebookAuthGuard',
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.controller.ts')) out.push(full);
  }
  return out;
}

function hasAuth(block: string): boolean {
  if (/@Public\s*\(/.test(block)) return true;
  if (/@UseGuards\s*\(([^)]*)\)/.test(block)) {
    const guards = block.match(/@UseGuards\s*\(([^)]*)\)/g)?.join(' ') || '';
    if (AUTH_GUARD_HINTS.some((g) => guards.includes(g))) return true;
  }
  return false;
}

interface Finding {
  file: string;
  method: string;
  route: string;
}

function scanFile(file: string): Finding[] {
  const src = readFileSync(file, 'utf8');
  const findings: Finding[] = [];

  // Class-level guards/@Public apply to all handlers.
  const classHeader = src.split(/\n\s*(?:async\s+)?[a-zA-Z0-9_]+\s*\(/)[0];
  const classProtected = hasAuth(
    src.substring(0, src.indexOf('{', src.indexOf('class')) + 1),
  );

  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const decoratorMatch = lines[i].match(
      new RegExp(`@(${HTTP_DECORATORS.join('|')})\\s*\\(`),
    );
    if (!decoratorMatch) continue;

    // Gather the decorator block: walk backwards over contiguous decorators.
    let start = i;
    while (start > 0 && /^\s*@|^\s*\)/.test(lines[start - 1])) start--;
    // Walk forward to the handler signature line.
    let end = i;
    while (end < lines.length && !/\)\s*[:{]?\s*$/.test(lines[end])) end++;
    const block = lines.slice(start, Math.min(end + 2, lines.length)).join('\n');

    const routeArg = decoratorMatch.input?.match(
      /@(?:Get|Post|Put|Patch|Delete|All)\s*\(\s*['"`]?([^'"`)]*)/,
    );
    const route = routeArg?.[1] ?? '';
    const methodName =
      block.match(/(?:async\s+)?([a-zA-Z0-9_]+)\s*\(/)?.[1] ?? '?';

    if (classProtected || hasAuth(block)) continue;
    findings.push({ file, method: methodName, route });
  }

  return findings;
}

function main() {
  const files = walk(ROOT);
  const all: Finding[] = [];
  for (const f of files) all.push(...scanFile(f));

  if (all.length === 0) {
    console.log('✅ No unclassified routes found. All routes are @Public() or guarded.');
    process.exit(0);
  }

  console.error(`\n🔒 F-07: ${all.length} route(s) without @Public() or an auth guard:\n`);
  for (const f of all) {
    console.error(
      `  - ${f.method}() [${f.route || '/'}]  →  ${f.file.replace(ROOT, 'src')}`,
    );
  }
  console.error(
    '\nAdd @Public() (if intentionally public) or an auth guard, then re-run.\n',
  );
  process.exit(1);
}

main();
