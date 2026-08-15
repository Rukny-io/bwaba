/**
 * Replace file: junctions with real copies so Turbopack can resolve @rukny/* packages.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(appDir, '../..');

const workspaceDeps = [
  { name: '@rukny/auth', src: 'packages/auth' },
  { name: '@rukny/forms-shared', src: 'packages/forms-shared' },
  { name: '@rukny/thmanyah-font', src: 'packages/Thmanyah-Font-Family' },
];

function isReparsePoint(targetPath) {
  try {
    const stat = fs.lstatSync(targetPath);
    return (
      stat.isSymbolicLink() ||
      (process.platform === 'win32' &&
        stat.isDirectory() &&
        (stat.mode & 0o170000) === 0o120000)
    );
  } catch {
    return false;
  }
}

function materializePackage({ name, src }) {
  const source = path.join(repoRoot, src);
  const target = path.join(appDir, 'node_modules', name);

  if (!fs.existsSync(source)) {
    console.warn(`[materialize-workspace-deps] skip ${name}: missing ${source}`);
    return false;
  }

  if (fs.existsSync(target)) {
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink() || isReparsePoint(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    } else if (stat.isDirectory()) {
      const marker = path.join(target, 'package.json');
      if (fs.existsSync(marker) && !isReparsePoint(target)) {
        console.log(`[materialize-workspace-deps] keep ${name} (already materialized)`);
        return true;
      }
      fs.rmSync(target, { recursive: true, force: true });
    } else {
      fs.rmSync(target, { force: true });
    }
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true, dereference: true });
  console.log(`[materialize-workspace-deps] copied ${name}`);
  return true;
}

let ok = true;
for (const dep of workspaceDeps) {
  if (!materializePackage(dep)) ok = false;
}

if (!ok) {
  process.exit(1);
}
