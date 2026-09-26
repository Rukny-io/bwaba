/**
 * Replace file: copies with full package trees so Turbopack can resolve @rukny/*.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(appDir, '../..');

const workspaceDeps = [
  { name: '@rukny/forms-shared', src: 'packages/forms-shared' },
  { name: '@rukny/email-api-pricing', src: 'packages/email-api-pricing' },
  { name: '@rukny/thmanyah-font', src: 'packages/Thmanyah-Font-Family' },
];

function isMaterializedCurrent(source, target) {
  const sourcePkg = path.join(source, 'package.json');
  const targetPkg = path.join(target, 'package.json');
  if (!fs.existsSync(targetPkg)) return false;
  try {
    return (
      fs.readFileSync(sourcePkg, 'utf8') === fs.readFileSync(targetPkg, 'utf8')
    );
  } catch {
    return false;
  }
}

function ensurePackageBuilt(source) {
  const distIndex = path.join(source, 'dist', 'index.js');
  if (fs.existsSync(distIndex)) return true;

  const pkgJson = path.join(source, 'package.json');
  if (!fs.existsSync(pkgJson)) return false;

  console.log(
    `[materialize-workspace-deps] building ${path.basename(source)}…`,
  );
  execSync('npm run build', { cwd: source, stdio: 'inherit' });
  return fs.existsSync(distIndex);
}

let ok = true;

for (const { name, src } of workspaceDeps) {
  const source = path.join(repoRoot, src);
  const target = path.join(appDir, 'node_modules', name);

  if (!fs.existsSync(source)) {
    console.warn(`[materialize-workspace-deps] skip ${name}: missing ${source}`);
    ok = false;
    continue;
  }

  if (src === 'packages/email-api-pricing' && !ensurePackageBuilt(source)) {
    console.warn(`[materialize-workspace-deps] skip ${name}: dist build failed`);
    ok = false;
    continue;
  }

  if (fs.existsSync(target) && isMaterializedCurrent(source, target)) {
    console.log(`[materialize-workspace-deps] keep ${name} (already materialized)`);
    continue;
  }

  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true, dereference: true });
  console.log(`[materialize-workspace-deps] copied ${name}`);
}

if (!ok) {
  process.exit(1);
}
