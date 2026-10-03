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
  'JwtOrApiKeyGuard',
  'ApiKeyAuthGuard',
  'GlobalJwtAuthGuard',
  'InternalApiGuard',
  'CheckoutSessionGuard',
  'RolesGuard',
  'OwnerGuard',
  'PlanGuard',
  'WorkspaceGuard',
  'ApiKeyGuard',
  'WebhookGuard',
  'InstagramWebhookGuard',
  'TwoFactorRequiredGuard',
  'GoogleAuthGuard',
  'LinkedInAuthGuard',
  'FacebookAuthGuard',
  'GitHubAuthGuard',
  "AuthGuard('jwt')",
  'AuthGuard("jwt")',
];

const AUTH_DECORATOR_HINTS = ['@InternalOnly', '@ApiBearerAuth'];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.controller.ts')) out.push(full);
  }
  return out;
}

function isDecoratorLine(line: string): boolean {
  return /^\s*@/.test(line) || /^\s*\)/.test(line);
}

/** Collect all decorators for a handler (above and below the HTTP verb decorator). */
function gatherHandlerDecoratorBlock(lines: string[], httpLineIndex: number): string {
  let start = httpLineIndex;
  while (start > 0 && isDecoratorLine(lines[start - 1])) start--;

  let end = httpLineIndex;
  while (end + 1 < lines.length && isDecoratorLine(lines[end + 1])) end++;

  while (end + 1 < lines.length) {
    const next = lines[end + 1].trim();
    if (!next) {
      end++;
      continue;
    }
    if (/^@/.test(next)) {
      end++;
      continue;
    }
    if (/^(async\s+)?[a-zA-Z0-9_]+\s*\(/.test(next)) {
      end++;
      break;
    }
    break;
  }

  return lines.slice(start, end + 1).join('\n');
}

function hasAuth(block: string): boolean {
  if (/@Public\s*\(/.test(block)) return true;
  if (AUTH_DECORATOR_HINTS.some((d) => block.includes(d))) return true;
  const guards = block.match(/@UseGuards\s*\([^)]*\)/g)?.join(' ') || '';
  if (AUTH_GUARD_HINTS.some((g) => guards.includes(g))) return true;
  return false;
}

function hasSecondaryGuard(block: string): boolean {
  const guards = block.match(/@UseGuards\s*\([^)]*\)/g)?.join(' ') || '';
  return AUTH_GUARD_HINTS.some((g) => guards.includes(g));
}

/** Decorators on the exported *Controller class (avoids matching DTO `class` keywords). */
function getControllerClassDecoratorBlock(src: string): string {
  const match = src.match(
    /((?:^[\t ]*@.*\n)+)\s*export\s+class\s+\w+Controller\b/m,
  );
  if (match) return match[1];

  const beforeClass = src.match(/([\s\S]*?)export\s+class\s+\w+Controller\b/);
  if (!beforeClass) return '';

  const lines = beforeClass[1].split('\n');
  const decorators: string[] = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (/^\s*@/.test(line) || /^\s*\)/.test(line) || /^\s*$/.test(line)) {
      decorators.unshift(line);
    } else if (decorators.length > 0) {
      break;
    }
  }
  return decorators.join('\n');
}

interface PublicFinding {
  file: string;
  method: string;
  route: string;
  hasOtherGuard: boolean;
}

function scanPublicRoutes(file: string): PublicFinding[] {
  const src = readFileSync(file, 'utf8');
  const findings: PublicFinding[] = [];
  const lines = src.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const decoratorMatch = lines[i].match(
      new RegExp(`@(${HTTP_DECORATORS.join('|')})\\s*\\(`),
    );
    if (!decoratorMatch) continue;

    const block = gatherHandlerDecoratorBlock(lines, i);

    if (!/@Public\s*\(/.test(block)) continue;

    const routeArg = lines[i].match(
      /@(?:Get|Post|Put|Patch|Delete|All)\s*\(\s*['"`]?([^'"`)]*)/,
    );
    const route = routeArg?.[1] ?? '';
    const methodName =
      block.match(/(?:async\s+)?([a-zA-Z0-9_]+)\s*\(/)?.[1] ?? '?';
    const hasOtherGuard = hasSecondaryGuard(block);

    findings.push({ file, method: methodName, route, hasOtherGuard });
  }

  return findings;
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
  const classProtected = hasAuth(getControllerClassDecoratorBlock(src));

  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const decoratorMatch = lines[i].match(
      new RegExp(`@(${HTTP_DECORATORS.join('|')})\\s*\\(`),
    );
    if (!decoratorMatch) continue;

    const block = gatherHandlerDecoratorBlock(lines, i);

    const routeArg = lines[i].match(
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

function auditPublicRoutes(files: string[]) {
  const all: PublicFinding[] = [];
  for (const f of files) all.push(...scanPublicRoutes(f));

  const barePublic = all.filter((f) => !f.hasOtherGuard);
  const guardedPublic = all.filter((f) => f.hasOtherGuard);

  console.log(`\n🔒 @Public() route audit (${all.length} total):\n`);
  console.log(
    `  ${guardedPublic.length} bypass GlobalJwtAuthGuard but use another guard (JwtOrApiKeyGuard, OAuth, etc.)`,
  );
  console.log(
    `  ${barePublic.length} are fully public (no secondary auth guard on handler)\n`,
  );

  if (barePublic.length > 0) {
    console.log('Fully public routes (review for intentional exposure):\n');
    for (const f of barePublic) {
      console.log(
        `  - ${f.method}() [${f.route || '/'}]  →  ${f.file.replace(ROOT, 'src')}`,
      );
    }
    console.log('');
  }
}

function main() {
  const auditPublic = process.argv.includes('--public');
  const files = walk(ROOT);

  if (auditPublic) {
    auditPublicRoutes(files);
    process.exit(0);
  }

  const all: Finding[] = [];
  for (const f of files) all.push(...scanFile(f));

  if (all.length === 0) {
    console.log(
      '✅ No unclassified routes found. All routes are @Public() or guarded.',
    );
    process.exit(0);
  }

  console.error(
    `\n🔒 F-07: ${all.length} route(s) without @Public() or an auth guard:\n`,
  );
  console.error(
    '  (Routes without explicit markers still require JWT via GlobalJwtAuthGuard in enforce mode.)\n',
  );
  for (const f of all) {
    console.error(
      `  - ${f.method}() [${f.route || '/'}]  →  ${f.file.replace(ROOT, 'src')}`,
    );
  }
  console.error(
    '\nAdd @Public() (if intentionally public) or an auth guard, then re-run.',
  );
  console.error('Run with --public to audit all @Public() routes.\n');
  process.exit(1);
}

main();
