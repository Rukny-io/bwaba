/**
 * Replace file: copies with full package trees so Turbopack can resolve @rukny/*.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(appDir, '../..');

const workspaceDeps = [
  { name: '@rukny/auth', src: 'packages/auth' },
  { name: '@rukny/thmanyah-font', src: 'packages/Thmanyah-Font-Family' },
  {
    name: '@heroui/styles',
    src: 'packages/styles',
    fromApp: true,
  },
  {
    name: '@heroui/react',
    src: 'packages/react',
    fromApp: true,
    patchPackageJson: (pkg) => {
      if (pkg.dependencies?.['@heroui/styles'] === 'workspace:*') {
        pkg.dependencies['@heroui/styles'] = 'file:../styles';
      }
      return pkg;
    },
  },
];

for (const { name, src, fromApp, patchPackageJson } of workspaceDeps) {
  const source = fromApp ? path.join(appDir, src) : path.join(repoRoot, src);
  const target = path.join(appDir, 'node_modules', name);

  if (!fs.existsSync(source)) {
    console.warn(`[materialize-workspace-deps] skip ${name}: missing ${source}`);
    continue;
  }

  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });

  if (patchPackageJson) {
    const pkgPath = path.join(target, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    fs.writeFileSync(pkgPath, JSON.stringify(patchPackageJson(pkg), null, 2));
  }

  console.log(`[materialize-workspace-deps] copied ${name}`);
}
