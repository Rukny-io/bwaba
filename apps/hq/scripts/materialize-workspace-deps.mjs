/**
 * Replace file: copies with full package trees so Turbopack can resolve @rukny/*
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(appDir, '../..');

const workspaceDeps = [
  { name: '@rukny/auth', src: 'packages/auth' },
  { name: '@rukny/thmanyah-font', src: 'packages/Thmanyah-Font-Family' },
];

for (const { name, src } of workspaceDeps) {
  const source = path.join(repoRoot, src);
  const target = path.join(appDir, 'node_modules', name);

  if (!fs.existsSync(source)) {
    console.warn(`[materialize-workspace-deps] skip ${name}: missing ${source}`);
    continue;
  }

  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
  console.log(`[materialize-workspace-deps] copied ${name}`);
}
